const campaignInspectionDetail = (function () {
	
	const _urlParam = util.getUrlParam();
	
	// 해당 페이지 초기화 함수
	function init(){
		if(_urlParam && _urlParam.id) {
			_getData();
			_evInit();
		} else {
			location.href = "/campaign/inspection";
		}
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='detail'][data-act]").off();
		evo.on("click", function(ev){
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
			if(act_v == "clickNotes") { // 비고 확인 클릭
				event.clickNotes();
			} else if(act_v == "clickReject") { // 승인 거부 클릭
				event.clickReject(evo);
			} else if(act_v == "clickRejectConfirm") { // 사유 입력 후 승인 거부
				event.clickRejectConfirm();
			} else if(act_v == "clickApprove") { // 광고 승인 클릭
				event.clickApprove(evo);
			} else if(act_v == "clickMaterial") {
				event.clickMaterial(evo);
			} else if(act_v == "clickVideoClose") {
				event.clickVideoClose();
			} else if(act_v == "clickList") {
				event.clickList();
			}
		}
	}
	
	// 상세 내용 가져오기
	function _getData() {
		let url_v = "/sg/detail";
		
		let data_v = {
			"sg_id": _urlParam.id
		};
		
		comm.send(url_v, data_v, "POST", function(resp) {
			dev.log(resp);

			if(resp.data.detail) {
				_setData(resp.data);
			} else {
				location.href = "/campaign/inspection";
			}
		});
	}
	
	// 상세 내용 설정
	function _setData(data) {
		let detail = data.detail;
		let material = data.material;

		// 진행 중 광고 확인 => 진행 중인 광고일 경우 승인 거부 안됨
		$("#sgRejectBtn").attr({"sg-progress": data.detail.is_progress});
		
		// 광고 상태 확인
		$("#sgRejectBtn").attr({"sg-status": detail.status});
		$("#sgApproveBtn").attr({"sg-status": detail.status});
		
		// 광고 타입에 따른 필드 설정
		let payType = detail.pay_type;
		$("#payType").html(payType);
		
		let cpp_o = $("[data-type='cpp']");
		let cpm_o = $("[data-type='cpm']");
		let startYmd = detail.start_ymd;

		if(payType == "CPP") {
			// CPP
			cpm_o.hide();
			
			// 비고 확인 얼럿
			if(util.valNullChk(detail.notes)) {
				$("#productNotes").hide();
				$("#productName").removeClass("highlight");
			} else {
				customModal.alert({
					content: "비고가 입력된 상품입니다.<br/>내용을 확인해주세요."
				});
			}

			// 광고 기간
			let endYmd = detail.end_ymd;
			let startDate = new Date(startYmd);
			let endDate = new Date(endYmd);
			let diffDate = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60  *24); 
			$("#cppSgDate").html(diffDate + "일(" + startYmd + " ~ " + endYmd + ")");
			
			// 매체
			$("#productName").html(detail.product_name);	
			
			// 비고
			$("#notesContent").val(util.unescapeData(detail.notes));
			
			// CPP 소재
			let li_o = $("#materialList");
			_drawMaterial(material[0], li_o);
		} else {
			// CPM
			cpp_o.hide();
			
			// 광고 시작일
			$("#cpmSgDate").html(startYmd);
			
			// 노출 옵션
			let targetOption = "사용 안 함";
			if (detail.target_area_yn == "Y" && detail.target_week_yn == "N") {
				targetOption = "지역";
			}  else if (detail.target_area_yn == "N" && detail.target_week_yn == "Y") {
				targetOption = "시간";
			}
			$("#cpmOption").html(targetOption);
			$("#cpmExposureTarget").html(util.numberWithComma(detail.exposure_target) + "회");
			if(util.valNullChk(detail.exposure_limit)) {
				$("#cpmExposureLimit").html("-");
			} else {
				$("#cpmExposureLimit").html(util.numberWithComma(detail.exposure_limit) + "회");
			}
			
			// CPM 소재
			let li_o = $("#materialList");
			let p_ratio_o = $("<p>");
			if(detail.material_ratio == "S") {
				p_ratio_o.html("1:1");
			} else {
				let horizon = "";
				let vertical = "";
				let horizonType = detail.exposure_horizon_type;
				let verticalType = detail.exposure_vertical_type;
				if(horizonType == "N") {
					horizon = "사용 안함";
				} else if(horizonType == "S") {
					horizon = "선택 사이즈에만 노출";
				} else if(horizonType == "D") {
					horizon = "유동적 소재 사용";
				}
				if(verticalType == "N") {
					vertical = "사용 안함";
				} else if(verticalType == "S") {
					vertical = "선택 사이즈에만 노출";
				} else if(verticalType == "D") {
					vertical = "유동적 소재 사용";
				}
				p_ratio_o.html("가로/세로 : 가로-" + horizon + " / 세로-" + vertical);
			}
			li_o.append(p_ratio_o);
			
			for(let item of material) {
				_drawMaterial(item, li_o);
			}
		}
		
		// 입금 상태
		let payStatus = detail.pay_status_code;
		if(payStatus == "PAY_WAIT") {
			$("#payStatus").html("입금 대기");
		} else if(payStatus == "PAY_COMPLETE") {
			$("#payStatus").attr({"pay-complete": 1}).html("입금 완료");
		} else if(payStatus == "REFUND_WAIT") {
			$("#payStatus").html("환불 대기");
		} else if(payStatus == "REFUND_COMPLETE") {
			$("#payStatus").html("환불 완료");
		}
		
		// 대행사
		let agencyName = detail.agency_name;
		if(util.valNullChk(agencyName)) {
			$("#agencyName").html("없음");
		} else {
			$("#agencyName").html(agencyName);
		}
		
		// 광고주
		$("#demandName").html(detail.company_name);
		
		// 광고 제목
		$("#sgName").html(detail.name);
		
		// 광고 신청 금액
		$("#sgPrice").html(util.numberWithComma(detail.price));
		
		// 카테고리
		$("#mainCategory").html(detail.main_category);
		$("#middleCategory").html(detail.middle_category);
		$("#subCategory").html(detail.sub_category);
		
		_evInit();
	}
	
	// 광고 소재 동적 추가
	function _drawMaterial(item, li_o) {
		let filePath = globalConfig.getS3Url() + item.file_path;
		let div_o = $("<div>").attr({
			"class": "existingFile",
			"data-material-id": item.material_id
		});
		let button_o = $("<button>").attr({
			"type": "button",
			"data-src": "detail",
			"data-act": "clickMaterial",
			"data-material": filePath,
			"data-type": item.material_kind,
		});
		let strong_o = $("<strong>").addClass("filetype");
		if(item.material_kind == "VIDEO") {
			let video_o = $("<video>").attr({
				"src": filePath,
			}).css({
				"width": "100%",
				"height": "auto",
				"vertical-align": "top"
			});
			strong_o.addClass("type-vid");
			button_o.append(strong_o, video_o);
		} else {
			let img_o = $("<img>");
			img_o.attr({"src": filePath});
			strong_o.addClass("type-img");
			button_o.append(strong_o, img_o);
		}
		let div2_o = $("<div>");
		let p_size_o = $("<p>").html(item.description);
		if(item.exposure_horizon_type == "D" || item.exposure_horizon_type == "D") {
			let span_type_o = $("<span>").addClass("colorRed").html("&nbsp;&nbsp;유동적 소재 사용");
			p_size_o.append(span_type_o);
		}
		let p_name_o = $("<p>").html(item.file_name);
		let p_o = $("<p>");
		let span_time_o = $("<span>").html("0:"+item.exposure_time);
		let span_size_o = $("<span>").html(util.convertByte(item.file_size));
		
		p_o.append(span_time_o, span_size_o);
		div2_o.append(p_size_o, p_name_o, p_o);
		div_o.append(button_o, div2_o);
		li_o.append(div_o);
		
		return li_o;
	}
	
	// 이벤트 담당
	let _event = {
		// 비고 클릭
		clickNotes: function() {
			$("#notesModal").modal("show");	
		},
		
		// 승인 거부 클릭
		clickReject: function(evo) {
			let status = evo.attr("sg-status");
			
			if(status == 9) {
				customModal.alert({
					content: "이미 승인거부된 광고입니다."
				});	
				return;
			} else if(status != 0 && evo.attr("sg-progress") == "true") {
				customModal.alert({
					content: "이미 진행된 광고는<br>거부하실 수 없습니다."
				});	
				return;
			}
			$("#rejectModal").modal("show");
		},
		
		// 사유 입력 후 승인 거부
		clickRejectConfirm: function() {
			let rejectReason = $("#rejectReason").val();
			
			if(util.valNullChk(rejectReason)) {
				customModal.alert({
					content: "승인거부 사유를 입력해주세요."
				});
				return;
			}
			
			let url_v = "/sg/approvalStatus/modify";
			
			let data_v = {
				"sg_id": _urlParam.id,
				"approval": "N",
				"reject_reason": rejectReason
			}
			
			comm.send(url_v, data_v, "POST", function() {
				$("#rejectModal").modal("hide");
				location.href = "/campaign/inspection";
			});
			
		},
		
		// 광고 승인
		clickApprove: function(evo) {
			let status = evo.attr("sg-status");
			
			if(status == 1 || status == 7 || status == 8) {
				customModal.alert({
					content: "이미 승인완료된 광고입니다."
				});
				return;
			} else if (status == 9) {
				customModal.alert({
					content: "이미 거부된 광고는 승인하실 수 없습니다."
				});
				return;
			}
			if($("#payStatus").attr("pay-complete") == 1) {
				let url_v = "/sg/approvalStatus/modify";
				
				let data_v = {
					"sg_id": _urlParam.id,
					"approval": "Y",
				}
				
				comm.send(url_v, data_v, "POST", function() {
					location.href = "/campaign/inspection";
				});
			} else {
				customModal.alert({
					content: "입금이 완료되지 않아<br/>승인할 수 없습니다."
				});
			}
		},
		
		// 소재 보기
		clickMaterial: function(evo) {
			let filePath = evo.attr("data-material");
			let fileType = evo.attr("data-type");
			let video_o = $("#materialView");
			
			if(fileType == "IMAGE") {
				video_o.attr({
					"poster": filePath,
				});
			} else if(fileType == "VIDEO") {
				video_o.attr({
					"src": filePath,
					"autoplay": true,
					"controls": true,
				});
			}
			video_o.off("loadedmetadata");
			video_o.on("loadedmetadata", () => {
				let interval = setInterval(function(){
					if(video_o.get(0).readyState == 4) {
						clearInterval(interval);
					} else {
						video_o.get(0).load();
					}
				}, 1000);
			});
			
			$("#videoModal").modal("show");
		},
		
		//영상 종료
		clickVideoClose: function() {
			$("#materialView").get(0).pause();
		},
		
		// 목록으로 이동
		clickList: function() {
			location.href = "/campaign/inspection";
		}
	}
	
	return {
		init
	}
	
})();