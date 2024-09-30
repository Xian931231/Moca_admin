package com.mocafelab.admin.device;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.mocafelab.admin.file.S3Service;
import com.mocafelab.admin.product.ExternalProductMapper;
import com.mocafelab.admin.product.ExternalProductService;
import com.mocafelab.admin.vo.BeanFactory;
import com.mocafelab.admin.vo.Code;
import com.mocafelab.admin.vo.ResponseMap;

import net.newfrom.lib.file.UploadFileInfo;
import net.newfrom.lib.util.CommonUtil;

@Service
@Transactional(rollbackFor = Exception.class)
public class ExternalDeviceService { 

	@Autowired
	private ExternalDeviceMapper externalDeviceMapper;
	
	@Autowired
	private ExternalProductMapper externalProductMapper;
	
	@Autowired
	private ExternalProductService externalProductService;
	
	@Autowired
	private BeanFactory beanFactory;
	
	@Autowired
	private S3Service s3Service;
	
	@Value("${file.path.ssp.sensor}")
	private String FILE_SSP_SENSOR_PATH;
	
	/**
	 * 디바이스 목록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();

		List<Map<String, Object>> deviceList = externalDeviceMapper.getList(param);
		
		respMap.setBody("list", deviceList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 디바이스 등록/수정
	 * @param param
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public Map<String, Object> addDevice(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 등록 또는 수정되는 디바이스 목록
		List<Map<String, Object>> addDeviceList = (List<Map<String, Object>>) param.get("add_device_list"); 
		
		// 삭제 되는 디바이스 ID 리스트
		List<Integer> removeDeviceIdList = (List<Integer>) param.get("remove_device_id_list");
		
		// 삭제되는 디바이스 유효성 검사
		for(Integer deviceId : removeDeviceIdList) {
			param.put("device_id", deviceId);
			
			// 상품에 속한 디바이스인지 체크
			if(externalDeviceMapper.hasDeviceInCategory(param) < 1) {
				return respMap.getResponse(Code.EXTERNAL_NOT_IN_PRODUCT_DEVICE);
			}
			
			// 상품에 속한 디바이스인지 체크
			if(externalDeviceMapper.hasDeviceInProgressCppCategory(param) > 0) {
				return respMap.getResponse(Code.EXTERNAL_DEVICE_REMOVE_FAIL_HAS_PROGRESS_CPP);
			} 
		};

		// 디바이스 삭제
		for(Integer deviceId : removeDeviceIdList) {
			if(externalDeviceMapper.removeDevice(deviceId) <= 0) {
				throw new RuntimeException();
			}
		};
		Code code = Code.OK;
		
		// 시리얼 넘버 중복 체크
		if(this.<String>isDuplicationListMap(addDeviceList, "serial_number")) {
			code = Code.EXTERNAL_DUPLICATE_SERIALNUM;
		}
		
		if(code == Code.OK) {
			// 시리얼 넘버 DB 중복 체크
			for(Map<String, Object> device : addDeviceList) {
				if(externalDeviceMapper.hasDuplicateDeviceSerialNum(device) > 0) {
					code = Code.EXTERNAL_DUPLICATE_SERIALNUM;
					break;
				}
			}
		}
		
		if(code != Code.OK) {
			TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
			
			return respMap.getResponse(code);
		}
		
		// 등록 or 수정
		for(Map<String, Object> device : addDeviceList) {
			if(CommonUtil.checkIsNull(device, "model_name") || CommonUtil.checkIsNull(device, "serial_number")) {
				throw new RuntimeException();
			}
			device.put("product_id", param.get("product_id"));
			
			if(CommonUtil.checkIsNull(device, "device_id")) {
				// insert
				if(externalDeviceMapper.addDevice(device) <= 0) {
					throw new RuntimeException();
				}
			} else {
				// update
				if(externalDeviceMapper.modifyDevice(device) <= 0) {
					throw new RuntimeException();
				}
			}
		};
		Map<String, Object> product = externalProductMapper.getProductSpecDetail(param);
		
		// 디바이스 최초 등록이면 디바이스 등록 날짜 입력
		if(addDeviceList.size() > 0 && CommonUtil.checkIsNull(product, "device_insert_date")) {
			if(externalDeviceMapper.modifyProductDeviceInsertDt(param) <= 0) {
				throw new RuntimeException();
			}
		}
		return respMap.getResponse();
	}
	
	/**
	 * 측정 장비 목록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getSensorList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		List<Map<String, Object>> sensorList = externalDeviceMapper.getSensorList(param);
		
		// 측정 장비 아이디에 해당하는 기기 목록 맵핑
		if(!CommonUtil.checkIsNull(param, "is_with_device")) {
			String isWithDevice = (String)param.get("is_with_device");
			
			if(isWithDevice.equals("Y")) {
				sensorList.forEach(sensor -> {
					sensor.put("is_not_matching", "Y");
					sensor.put("except_motor_id", param.get("except_motor_id"));
					
					List<Map<String, Object>> deviceList = externalDeviceMapper.getSensorDeviceList(sensor); 
					
					sensor.put("device_list", deviceList);
				});
			}
		}
		respMap.setBody("list", sensorList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 측정 장비 상세
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getSensorDetail(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		Map<String, Object> sensorDetail = externalDeviceMapper.getSensorDetail(param);
		
		if(CommonUtil.checkIsNull(sensorDetail)) {
			return respMap.getResponse(Code.NOT_EXIST_DATA);
		} 
		respMap.setBody("data", sensorDetail);
		
		return respMap.getResponse();
	}
	
	/**
	 * 측정 장비 등록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> addSensor(Map<String, Object> param, MultipartHttpServletRequest mRequest) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 분류 별 측정 장비 이름 중복 체크
		if(externalDeviceMapper.hasDuplicateSensorName(param) > 0) {
			return respMap.getResponse(Code.EXTERNAL_DUPLICATE_SENSOR_NAME);
		}
		
		// 장비 등록
		if(externalDeviceMapper.addSensor(param) <= 0) {
			throw new RuntimeException();
		}
		
		// 이미지 등록
		MultipartFile mFile = mRequest.getFile("sensor_image");
		
		UploadFileInfo uploadFileInfo = null;
		
		// 파일 업로드
		if(mFile != null) {
			// ext, mime type체크
			if(!externalProductService.isAllowdFileType(mFile)) {
				throw new RuntimeException();
			}
			
			uploadFileInfo = s3Service.uploadFile(mFile, FILE_SSP_SENSOR_PATH + File.separator + param.get("sensor_id")); 
			param.put("image_path", uploadFileInfo.getFilePath());
			param.put("file_name", uploadFileInfo.getFileName());
			
			// 이미지 정보 업데이트
			if(externalDeviceMapper.modifySensor(param) <= 0) {
				s3Service.removeFile(uploadFileInfo.getFilePath());
				
				throw new RuntimeException();
			}
		}
		return respMap.getResponse();
	}
	
	/**
	 * 측정 장비 수정
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> modifySensor(Map<String, Object> param, MultipartHttpServletRequest mRequest) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 분류 별 측정 장비 이름 중복 체크
		if(externalDeviceMapper.hasDuplicateSensorName(param) > 0) {
			return respMap.getResponse(Code.EXTERNAL_DUPLICATE_SENSOR_NAME);
		}
		
		// 이미지 등록
		MultipartFile mFile = mRequest.getFile("sensor_image");
		
		UploadFileInfo uploadFileInfo = null;
		
		// 파일 업로드
		if(mFile != null) {
			// ext, mime type체크 
			if(!externalProductService.isAllowdFileType(mFile)) {
				throw new RuntimeException();
			}
			
			// 이전에 등록된 파일 삭제
			Map<String, Object> sensorDetail = externalDeviceMapper.getSensorDetail(param);
			
			if(!CommonUtil.checkIsNull(sensorDetail, "image_path")) {
				String savedFile = (String) sensorDetail.get("image_path");
				
				if(s3Service.removeFile(savedFile) == false) {
					throw new RuntimeException();
				}
			}
			uploadFileInfo = s3Service.uploadFile(mFile, FILE_SSP_SENSOR_PATH + File.separator + param.get("sensor_id")); 
			param.put("image_path", uploadFileInfo.getFilePath());
			param.put("file_name", uploadFileInfo.getFileName());
		}
		
		// update
		if(externalDeviceMapper.modifySensor(param) <= 0) {
			s3Service.removeFile(uploadFileInfo.getFilePath());
			
			throw new RuntimeException();
		}
		return respMap.getResponse();
	}
	
	/**
	 * 측정 장비 시리얼 번호 목록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getSensorDeviceList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();

		List<Map<String, Object>> sensorSerialList = externalDeviceMapper.getSensorDeviceList(param);
		
		respMap.setBody("list", sensorSerialList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 측정 장비 시리얼 번호 등록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public Map<String, Object> addSensorDevice(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 등록 또는 수정되는 시리얼 번호 리스트
		List<Map<String, Object>> addSensorDeviceList = (List<Map<String, Object>>) param.get("add_sensor_device_list"); 
		
		// 삭제 되는 측정 장비 아이디 리스트 
		List<Integer> removeDeviceIdList = (List<Integer>) param.get("remove_sensor_device_id_list");
		
		// 장비에 속하는 측정 장비인지 체크
		for(Integer deviceId : removeDeviceIdList) {
			param.put("sensor_device_id", deviceId);
			
			if(externalDeviceMapper.hasSensorDeviceInSensor(param) < 1) {
				return respMap.getResponse(Code.EXTERNAL_NOT_IN_SENSOR_DEVICE);
			}
		};
		
		// 측정 장비 삭제
		for(Integer deviceId : removeDeviceIdList) {
			param.put("sensor_device_id", deviceId);
			
			if(externalDeviceMapper.removeSensorDevice(deviceId) <= 0) {
				throw new RuntimeException();
			}
		};
		Code code = Code.OK;
		
		// 시리얼 번호 중복 체크
		if(this.<String>isDuplicationListMap(addSensorDeviceList, "serial_number")) {
			code = Code.EXTERNAL_DUPLICATE_SERIALNUM;
		}
		
		if(code == Code.OK) {
			// 시리얼 번호 DB 중복 체크
			for(Map<String, Object> sensorDevice : addSensorDeviceList) {
				if(externalDeviceMapper.hasDuplicateSensorSerialNum(sensorDevice) > 0) {
					code = Code.EXTERNAL_DUPLICATE_SERIALNUM;
					break;
				}
			}
		}
		
		if(code != Code.OK) {
			TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
			
			return respMap.getResponse(code);
		}
		
		// 시리얼 번호 등록 또는 수정
		for(Map<String, Object> sensorDevice : addSensorDeviceList) {
			sensorDevice.put("ssp_sensor_id", param.get("sensor_id"));
			
			// 아이디가 없으면 등록 있으면 수정
			if(CommonUtil.checkIsNull(sensorDevice, "sensor_device_id")) {
				if(externalDeviceMapper.addSensorDevice(sensorDevice) <= 0) {
					throw new RuntimeException();
				}
			} else {
				if(externalDeviceMapper.modifySensorDevice(sensorDevice) <= 0) {
					throw new RuntimeException();
				}
			}
		}
		return respMap.getResponse();
	}
	
	/**
	 * 게재 위치 목록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getMotorPositionList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		List<Map<String, Object>> motorPositionList = externalDeviceMapper.getMotorPositionList(param);
		
		respMap.setBody("list", motorPositionList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 게재 위치 목록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getMotorPositionDetail(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		Map<String, Object> motorPositionDetail = externalDeviceMapper.getMotorPositionDetail(param);
		
		if(CommonUtil.checkIsNull(motorPositionDetail)) {
			return respMap.getResponse(Code.NOT_EXIST_DATA);
		} 
		
		respMap.setBody("data", motorPositionDetail);
		
		return respMap.getResponse();
	}
	
	/**
	 * 게재 위치 등록/수정  
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> addMotorPosition(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 게재 위치 명 중복 체크
		if(externalDeviceMapper.hasDuplicateMotorPositionName(param) > 0) {
			return respMap.getResponse(Code.EXTERNAL_DUPLICATE_MOTOR_POSITION_NAME);
		}
		
		if(CommonUtil.checkIsNull(param, "motor_position_id")) {
			// 등록
			if(externalDeviceMapper.addMotorPosition(param) <= 0) {
				throw new RuntimeException();
			}
		} else {
			// 수정 
			if(externalDeviceMapper.modifyMotorPosition(param) <= 0) {
				throw new RuntimeException();
			}
		}
		return respMap.getResponse();
	}
	
	/**
	 * 게재 위치 구분 아이디 목록
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getMotorPositionIdList(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		List<Map<String, Object>> motorPositionIdList = externalDeviceMapper.getMotorPositionIdList(param);
		
		respMap.setBody("list", motorPositionIdList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 게재 위치 등록/수정/삭제
	 * @param param
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public Map<String, Object> addMotorPositionId(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 등록 OR 수정 되는 게재 위치 구분 아이디
		List<Map<String, Object>> addMotorIdList = (List<Map<String, Object>>) param.get("add_motor_id_list");
		
		// 삭제 되는 게재 위치 구분 아이디 
		List<Integer> removeMotorIdList = (List<Integer>) param.get("remove_motor_id_list");
		
		// 게재 위치 상세 정보
		Map<String, Object> motorPosition = externalDeviceMapper.getMotorPositionDetail(param);
		
		if(motorPosition == null) {
			throw new RuntimeException();
		}
		long categoryId = (long) motorPosition.get("category_id");
		int motorPositionId = (int) param.get("motor_position_id");
		int loginId =  Integer.parseInt((String)param.get("external_login_id"));
		
		Code code = Code.OK;

		// 진행중인 CPP 광고가 있으면 삭제 불가, 게재위치와 연결된 상품의 기기, 측정장비가 있는지 체크 후 있으면 연결 해제
		for(int motorId : removeMotorIdList) {
			Map<String, Object> hasMatchingDevice = externalDeviceMapper.hasMatchingDevice(motorId);
			
			// 진행중인 CPP광고 개수
			long inProgressCppCnt = (long)hasMatchingDevice.get("in_progress_cpp_cnt");
			// 상품의 기기와 연결된 개수
			long productDeviceCnt = (long)hasMatchingDevice.get("matching_product_device_cnt");
			// 측정장비와 연결된 개수
			long sensorDeviceCnt = (long)hasMatchingDevice.get("matching_sensor_device_cnt");
			
			// 진행중인 CPP 광고의 상품은 삭제 불가능
			if(inProgressCppCnt > 0) {
				code = Code.EXTERNAL_MOTOR_REMOVE_FAIL_HAS_PROGRESS_CPP;
				break;
			}
			
			if(productDeviceCnt > 0) {
				if(externalDeviceMapper.modifyDeviceMotorIdToNull(motorId) <= 0) {
					throw new RuntimeException();
				}
			}
			
			if(sensorDeviceCnt > 0) {
				if(externalDeviceMapper.modifySensorMotorIdToNull(motorId) <= 0) {
					throw new RuntimeException();
				}
			}
		}
		
		// 삭제
		if(code == Code.OK) {
			for(int motorId : removeMotorIdList) {
				if(externalDeviceMapper.removeMotorPositionId(motorId) <= 0) {
					throw new RuntimeException();
				}
			}
		}
		
		// 구분 아이디 중복 체크
		if(code == Code.OK) {
			if(this.<String>isDuplicationListMap(addMotorIdList, "car_number")) {
				code = Code.EXTERNAL_DUPLICATE_MOTOR_POSITION_ID;
			}
		}
				
		if(code == Code.OK) {
			// IP 유효성 체크
			for(Map<String, Object> motor : addMotorIdList) {
				String ip = (String)motor.get("ip_address");
				if(!validateIp(ip)) {
					code = Code.EXTERNAL_INVALID_MOTOR_POSITION_IP;
					break;
				}
			}
		}
		
		if(code == Code.OK) {
			// IP 중복 체크
			if(this.<String>isDuplicationListMap(addMotorIdList, "ip_address")) {
				code = Code.EXTERNAL_DUPLICATE_MOTOR_POSITION_IP;
			}
		}
		
		if(code == Code.OK) {
			// 구분 아이디, IP DB 중복 체크
			for(Map<String, Object> addId : addMotorIdList) {
				if(externalDeviceMapper.hasDuplicateMotorId(addId) > 0) {
					code = Code.EXTERNAL_DUPLICATE_MOTOR_POSITION_ID;
					break;
				}
	
				if(externalDeviceMapper.hasDuplicateMotorIP(addId) > 0) {
					code = Code.EXTERNAL_DUPLICATE_MOTOR_POSITION_IP;
					break;
				}
			}
		}
		
		if(code != Code.OK) {
			TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
			
			return respMap.getResponse(code);
		}

		// 등록 or 수정
		for(Map<String, Object> addId : addMotorIdList) {
			addId.put("motor_position_id", motorPositionId);
			addId.put("external_login_id", loginId);
			addId.put("category_id", categoryId);
			
			if(CommonUtil.checkIsNull(addId, "car_number") || CommonUtil.checkIsNull(addId, "ip_address")) {
				throw new RuntimeException();
			}
			
			if(CommonUtil.checkIsNull(addId, "motor_id")) {
				// 등록 
				if(externalDeviceMapper.addMotorPositionId(addId) <= 0) {
					throw new RuntimeException();
				}
			} else {
				// 수정
				if(externalDeviceMapper.modifyMotorPositionId(addId) <= 0) {
					throw new RuntimeException();
				}
			}
		}
		return respMap.getResponse();
	}
	
	/**
	 * 기기/위치 매칭 상세 정보
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> getMatchingDetail(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 게재 위치 구분 아이디 상세
		Map<String, Object> motorPositionId = externalDeviceMapper.getMotorPositionIdDetail(param);
		respMap.setBody("data", motorPositionId);
		
		if(CommonUtil.checkIsNull(motorPositionId)) {
			return respMap.getResponse(Code.NOT_EXIST_DATA);
		} 
		
		// 매칭된 기기
		List<Map<String, Object>> matchingDeviceList = externalDeviceMapper.getList(param);
		motorPositionId.put("matching_device_list", matchingDeviceList);
		
		// 매칭된 측정 장비
		List<Map<String ,Object>> matchingSensorDeviceList = externalDeviceMapper.getSensorDeviceList(param);
		motorPositionId.put("matching_sensor_device_list", matchingSensorDeviceList);
		
		return respMap.getResponse();
	}
	
	/**
	 * 기기/위치 매칭 검수
	 * @param param
	 * @return
	 * @throws Exception
	 */
	public Map<String, Object> modifyMotorStatus(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
	
		// 검수
		if(externalDeviceMapper.modifyMotorStatus(param) <= 0) {
			throw new RuntimeException();
		}
		return respMap.getResponse();
	}
	
	/**
	 * 기기/위치 매칭
	 * @param param
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public Map<String, Object> addMatching(Map<String, Object> param) throws Exception {
		ResponseMap respMap = beanFactory.getResponseMap();
		
		// 매칭 되는 디바이스
		List<Integer> addDeviceIdList = (List<Integer>) param.get("add_device_id_list");
		
		// 매칭 해지 되는 디바이스
		List<Integer> removeDeviceIdList = (List<Integer>) param.get("remove_device_id_list");
		
		// 매칭 되는 측정 장비
		List<Integer> addSensorDeviceIdList = (List<Integer>) param.get("add_sensor_device_id_list");
		
		// 매칭 해지 되는 측정 장비
		List<Integer> removeSensorDeviceIdList = (List<Integer>) param.get("remove_sensor_device_id_list");
		
		// 매칭 정보 
		Map<String, Object> motorDetail = externalDeviceMapper.getMotorPositionIdDetail(param);
		
		Map<String, Object> addParam = new HashMap<>();
		addParam.put("motor_id", null);
		
		// 디바이스/위치 매칭 삭제
		for(int deviceId : removeDeviceIdList) {
			addParam.put("device_id", deviceId);
			
			if(externalDeviceMapper.modifyDeviceMotorId(addParam) <= 0) {
				throw new RuntimeException();
			}
		}
		
		// 측정 장비/위치 매칭 삭제
		for(int sensorDeviceId : removeSensorDeviceIdList) {
			addParam.put("sensor_device_id", sensorDeviceId);
			
			if(externalDeviceMapper.modifySensorDeviceMotorId(addParam) <= 0) {
				throw new RuntimeException();
			}
		}
		
		// 유효성 검사 파라미터
		Map<String, Object> validParam = new HashMap<>();
		validParam.put("category_id", motorDetail.get("category_id"));
		validParam.put("motor_id", param.get("motor_id"));
		
		addParam.put("motor_id", param.get("motor_id"));
		
		Code code = Code.OK;
		
		// 디바이스/위치 매칭
		for(int deviceId : addDeviceIdList) {
			validParam.put("device_id", deviceId);
			
			Map<String, Long> validDevice = externalDeviceMapper.hasValidMatchingDevice(validParam);
			
			// 0보다 크면 이미 다른 게재위치에 매칭된 디바이스 
			if(validDevice.get("already_matching_cnt") > 0) {
				code = Code.EXTERNAL_ALREADY_MATCHING_DEVICE;
				break;
			}
			
			// 0보다 크면 분류에 소속된 디바이스
			if(validDevice.get("category_device_cnt") <= 0) {
				code = Code.EXTERNAL_NOT_IN_CATEGORY_DEVICE;
				break;
			}
			
			// 0보다 크면 이미 해당 상품에 매칭된 디바이스가 존재 ( 상품당 매칭 가능한 디바이스는 하나 )
			if(validDevice.get("already_matching_product_cnt") > 0) {
				code = Code.EXTERNAL_ALREADY_MATCHING_PRODUCT;
				break;
			}
			
			addParam.put("device_id", deviceId);
			if(externalDeviceMapper.modifyDeviceMotorId(addParam) <= 0) {
				throw new RuntimeException();
			}
		}
		
		if(code == Code.OK) {
			// 측정 장비/위치 매칭
			for(int sensorDeviceId : addSensorDeviceIdList) {
				validParam.put("sensor_device_id", sensorDeviceId);
				
				Map<String, Long> validSensor = externalDeviceMapper.hasValidMatchingSensor(validParam); 

				if(validSensor.get("already_matching_cnt") > 0) {
					code = Code.EXTERNAL_ALREADY_MATCHING_SENSOR_DIVECE;
					break;
				}

				if(validSensor.get("category_sensor_cnt") <= 0) {
					code = Code.EXTERNAL_NOT_IN_CATEGORY_SENSOR_DEVICE;
					break;
				}

				if(validSensor.get("already_matching_product_cnt") > 0) {
					code = Code.EXTERNAL_ALREADY_MATCHING_SENSOR;
					break;
				}
				
				addParam.put("sensor_device_id", sensorDeviceId);
				if(externalDeviceMapper.modifySensorDeviceMotorId(addParam) <= 0) {
					throw new RuntimeException();
				}
			}
		}

		if(code != Code.OK) {
			TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
			
			return respMap.getResponse(code);
		}
		return respMap.getResponse();
	}
	
	/**
	 * List에 담긴 Map의 특정 key에 대한 중복 체크
	 * @param <T>
	 * @param list
	 * @param key
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public <T> boolean isDuplicationListMap(List<Map<String, Object>> list, String targetKey) throws Exception {
		if(list == null || targetKey.equals("")) {
			throw new RuntimeException();
		}
		
		long originCnt = list.stream()
				.map(m -> (T)m.get(targetKey))
				.filter(v -> v != null && !v.equals(""))
				.count();

		long distinctCnt = list.stream()
				.map(m -> (T)m.get(targetKey))
				.filter(v -> v != null && !v.equals(""))
				.distinct()
				.count();
		
		return originCnt != distinctCnt;
	}
	
	/**
	 * IP 유효성 체크
	 * @param ip
	 * @return
	 */
	public boolean validateIp(String ip) {
		if(ip == null || ip.equals("")) {
			return false;
		}
		String ipRegex = "(\\d{1,2}|0\\d\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\"
			          + ".(\\d{1,2}|0\\d\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\"
			          + ".(\\d{1,2}|0\\d\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\"
			          + ".(\\d{1,2}|0\\d\\d|1\\d\\d|2[0-4]\\d|25[0-5])";
		
		return ip.matches(ipRegex);
	}
}
