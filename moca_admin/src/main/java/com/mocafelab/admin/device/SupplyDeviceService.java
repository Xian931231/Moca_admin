package com.mocafelab.admin.device;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mocafelab.admin.vo.BeanFactory;
import com.mocafelab.admin.vo.ResponseMap;

@Service
public class SupplyDeviceService {

	@Autowired
	private BeanFactory beanFactory;
	
	@Autowired
	private SupplyDeviceMapper supplyDeviceMapper;
	
	/**
	 * 매체현황 > 장비 오류 현황 리스트
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDeviceErrorList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		List<Map<String, Object>> deviceErrorList = supplyDeviceMapper.getDeviceErrorList(param);
		respMap.setBody("list", deviceErrorList);
		
		int total = supplyDeviceMapper.getDeviceErrorCnt(param);
		respMap.setBody("tot_cnt", total);
		
		return respMap.getResponse();
	}
	
	/**
	 * 상품관리 > 디바이스 관리
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getDeviceList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();

		// 차량 리스트
		List<Map<String, Object>> motorList = supplyDeviceMapper.getMotorList(param);
		
		// 디바이스 리스트
		List<Map<String, Object>> deviceList = supplyDeviceMapper.getDeviceList(param);
		
		Map<String, Object> nullMap = new HashMap<>();
		int motorSort = 1;
		for(Map<String, Object> motor : motorList) {
			String motorId = String.valueOf(motor.get("motor_id"));
			
			List<Map<String, Object>> deviceWithMotor = new ArrayList<>();
			List<Map<String, Object>> motorNullList = new ArrayList<>();
			//for(Map<String, Object> device : deviceList) {
			for(int i = 0; i < deviceList.size(); i++) {
				Map<String, Object> device = deviceList.get(i);
				String motorIdInDevice = String.valueOf(device.get("motor_id"));
				if(motorIdInDevice.equals("0")) {
					motorNullList.add(device);
					
					if(i == 0) {
						motorSort = 0;
					}
				} else {
					if(motorIdInDevice.equals(motorId)) {
						deviceWithMotor.add(device);
					}
				}
			}
			motor.put("device_list", deviceWithMotor);
			
			nullMap.put("motor_id", 0);
			nullMap.put("device_list", motorNullList);
		}
		if(motorSort == 0) {
			motorList.add(0, nullMap);
		} else {
			motorList.add(nullMap);
		}
		
		respMap.setBody("list", motorList);
		
		int total = supplyDeviceMapper.getDeviceCnt(param);
		respMap.setBody("tot_cnt", total);
		
		return respMap.getResponse();
	}
}
