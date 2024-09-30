package com.mocafelab.admin.dashboard;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mocafelab.admin.vo.BeanFactory;
import com.mocafelab.admin.vo.ResponseMap;

@Service
public class DashboardService {
	
	@Autowired
	private BeanFactory beanFactory;
	
	@Autowired
	private DashboardMapper dashboardMapper;
	
	/**
	 * 대시보드 정보 조회
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDashboardDetail(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		Map<String, Object> count = dashboardMapper.getDashboardDetail(param);
		respMap.setBody("data", count);
		
		return respMap.getResponse();
	}
	
	/**
	 * 대시보드 노출 수 정보 조회
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDashboardExposure(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		int totalExposrue = dashboardMapper.getExposureTotal(param);
		List<Map<String, Object>> list = dashboardMapper.getExposureData(param);
		respMap.setBody("tot_exposure", totalExposrue);
		respMap.setBody("list", list);
		
		return respMap.getResponse();
	}
	
	/**
	 * 대시보드 집행금액 정보 조
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDashboardPrice(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		int totalPrice = dashboardMapper.getPriceTotal(param);
		List<Map<String, Object>> list = dashboardMapper.getPriceData(param);
		respMap.setBody("tot_price", totalPrice);
		respMap.setBody("list", list);
		
		return respMap.getResponse();
	}
	
	/**
	 * 대시보드 매체, 구분, 상품 정보 조회
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDashboardSupply(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 전체 매체수
		int supplyCount = dashboardMapper.getSupplyCount(param);
		respMap.setBody("supply_cnt", supplyCount);
		
		// 운영 중인 상품 수
		int productCount = dashboardMapper.getProductCount(param);
		respMap.setBody("product_cnt", productCount);
		
		// 운영 매체 리스트
		List<Map<String, Object>> supplyList = dashboardMapper.getSupplyList(param);
		
		for(Map<String, Object> supply : supplyList) {
			int total = 0;
			// 하나의 매체사의 카테고리 리스트
			List<Map<String, Object>> categoryList = dashboardMapper.getCategoryExposureTotal(supply);
			
			for(Map<String, Object> category : categoryList) {
				total += Integer.valueOf(String.valueOf(category.get("category_count")));
			}
			categoryList.sort(
					Comparator.comparing((Map<String, Object> map)
							-> Integer.valueOf(String.valueOf(map.get("category_count")))).reversed()
			);
			supply.put("exposure_count", total);
			supply.put("category_list", categoryList);
		}
		
		supplyList.sort(
				Comparator.comparing((Map<String, Object> map)
						-> (Integer) map.get("exposure_count")).reversed()
		);
		respMap.setBody("list", supplyList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 대시보드 지도 zoomlevel에 따른 노출량 조회
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDashboardAreaList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		int level = Integer.valueOf(String.valueOf(param.get("map_level")));
		
		List<Map<String, Object>> list = new ArrayList<>();
		if(level <= 10) {
			list = dashboardMapper.getSiExposureTotal(param);
		} else if(level > 10 && level <= 13){
			list = dashboardMapper.getGuExposureTotal(param);
		} else {
			list = dashboardMapper.getMotorPointList(param);
			
			// 차량이 없는 경우
			if(list.size() == 0) {
				respMap.setBody("list", list);
				return respMap.getResponse();
			} else {
				param.put("motorList", list);
			}
			
			List<Map<String, Object>> motorList = dashboardMapper.getMotorExposureTotal(param);			
			List<Map<String, Object>> productList = dashboardMapper.getProductExposureTotal(param);
			
			for(Map<String, Object> point : list) {
				String pMotor_id = String.valueOf(point.get("motor_id"));
				
				for(Map<String, Object> motor : motorList) {
					String mMotor_id = String.valueOf(motor.get("motor_id"));
					
					if(pMotor_id.equals(mMotor_id)) {
						point.put("motor_data", motor);
						
						List<Map<String, Object>> tempProductList = new ArrayList<>();
						for(Map<String, Object> product : productList) {
							String dMotor_id = String.valueOf(product.get("motor_id"));
							
							if(mMotor_id.equals(dMotor_id)) {
								tempProductList.add(product);
							}
						}
						motor.put("product_list", tempProductList);
					}
				}
			}
		}
		respMap.setBody("list", list);
		
		return respMap.getResponse();
	}
}
