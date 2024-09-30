const companyModify = (function(){
	let _urlParam = util.getUrlParam();
	let _utype = null;
	let _req_company_regnum_image = null;
	let _extractedText = null;
	// 해당 페이지 초기화 함수
	function init(){
		_data.getData();
		_evInit();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='companyModify'][data-act]").off();
		evo.on("click change", function(ev){
			_action(ev);
		});
	}
	
	// 이벤트 분기 함수
	function _action(ev){
		let evo = $(ev.currentTarget);
		
		let act_v = evo.attr("data-act");
		
		let type_v = ev.type;
		
		let event = _event;
		
		if(type_v == "click") {
			//정보 수정 완료
			if(act_v == "modifyCompanyInfo"){
				event.modifyCompanyInfo();
			//이전 페이지 이동
			}else if(act_v == "prePage"){
				event.prePage();
			}else if(act_v == "getPostCode"){
				_postcodeInit();
			}
		}else if(type_v =="change"){
			if(act_v == "changeImg"){
				_event.changeImg(evo);	
			}
		}
	}
	
	let _event = {
		modifyCompanyInfo: function(){
			let url_v = "/member/modify/companyInfo";
			let data_v = _event.getSubmitData();
			
			let validate = _validate(data_v)
			
			if(!validate){
				loginCustomModal.alert({
						content: "입력되지 않은 항목이 있습니다.<br/>모든 정보를 입력해주세요.",
					});
					return;
			}
			
			data_v.company_regnum_image = $("#companyRegnumImage")[0].files[0];
			data_v.req_company_regnum_image = _req_company_regnum_image;
			data_v.req_company_regnum_file_name = $("#companyRegnumImage").siblings("label").text();
			data_v.member_update_req_id = _urlParam.request_id;
			
			let formData = util.getFormData(data_v);
			
			comm.sendFile(url_v, formData, "POST", function(resp){
				msg = "수정에 실패했습니다.";
				if(resp.result){
					msg = "수정되었습니다.";
				}
				customModal.alert({
					content: msg
					,confirmCallback: function() {
						if(_utype == "D"){
							location.href = "/member/demand/list";	
						}else{
							location.href = "/member/supply/list";
						}
					}
				})
			});
		},
		getSubmitData: function(){
			let data = {}
			
			data.ceo_name = $("#ceoName").val();
			data.biz_kind = $("#bizKind").val();
			data.biz_type = $("#bizType").val();
			data.zipcode = $("#zipcode").val();
			data.address1 = $("#address1").val();
			data.address2 = $("#address2").val();
			
			return data;
			
		},
		//파일 변경시 이름 노출 이벤트
		changeImg: function(evo){
			if($("#companyRegnumImage").val()){
				let fileName = $("#companyRegnumImage")[0].files[0].name;
				$("#companyRegnumImage").siblings(".custom-file-label").html(fileName);	
			}else{
				$("#companyRegnumImage").siblings(".custom-file-label").html(_extractedText);
			}
		},
		//이전 페이지로 이동 이벤트
		prePage: function(){
			if(_utype == "D"){
				location.href = "/member/demand/list";
			}else{
				location.href = "/member/supply/list";
			}
			
		}
	}
	
	let _data = {
		getData: function(){
			let url_v = "/member/company/detail";
			let data_v ={
				request_id: _urlParam.request_id
			}
			
			comm.send(url_v, data_v, "POST", function(resp){
				_data.drawData(resp.data);
			});
		},
		drawData: function(data){
			_utype = data.utype;
			
			if(_utype == "S"){
				$("#pageName").html("매체사 정보수정 요청 관리");
			}else{
				$("#pageName").html("광고주 정보수정 요청 관리");
			}
			
			
			// 상호명
			$("#companyName").html(data.company_name);
			// 사업자 등록번호
			$("#companyRegnum").html(data.company_regnum);
			// 대표자 성명
			$("#ceoName").val(util.unescapeData(data.ceo_name));
			// 업태
			$("#bizKind").val(util.unescapeData(data.biz_kind));
			// 업종
			$("#bizType").val(util.unescapeData(data.biz_type));
			// 사업장 주소
			$("#zipcode").val(util.unescapeData(data.zipcode));
			$("#address1").val(util.unescapeData(data.address1));
			// 상세 주소
			$("#address2").val(util.unescapeData(data.address2));
			//사업자 등록증
			_req_company_regnum_image = data.req_company_regnum_image;
			
			_extractedText = data.req_company_regnum_file_name
			$("#companyRegnumImage").siblings(".custom-file-label").html(data.req_company_regnum_file_name);	
		}
	}
	
	// 다음 주소찾기
	function _postcodeInit() {
		new daum.Postcode({
        	oncomplete: function(data) {
                let address = ""; // 주소
		        let zipcode_o = $("#zipcode"); // 우편번호
		        let address1_o = $("#address1"); // 주소
		        let address2_o = $("#address2").val(""); // 상세주소
		
		        if (data.userSelectedType == "R") { // 도로명 주소
		            address = data.roadAddress;
		        } else { // 지번 주소
		            address = data.jibunAddress;
		        };
		        
				// 각 필드에 주소값을 넣는다.
		        zipcode_o.val(data.zonecode);
		        address1_o.val(address);
		        
		        // 상세주소 칸으로 커서 이동
		        address2_o.focus();
            }
        }).open();
	}
	//유효성 검사
	function _validate(data){
		let result = true;
		
		for(let info in data){
			if(data[info] == null || data[info] == "") {
				result = false;
			}
			
		}
		return result;
	}
	
	return {
		init
	}
})();