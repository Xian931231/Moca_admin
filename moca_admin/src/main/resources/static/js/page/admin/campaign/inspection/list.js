const campaignInspectionList = (function () {
	
	const _urlParam = util.getUrlParam();
		
	// 해당 페이지 초기화 함수
	function init(){
		// 대시보드 카드 클릭 후 이동한 경우 조건 추가
		
		if(!util.valNullChk(_urlParam)) {
			if(_urlParam.type == "WC") {
				$("#sgStatus").val(1);
			} else if(_urlParam.type == "PC") {
				$("#payStatus").val("PAY_COMPLETE");
			} else if(_urlParam.type == "RC") {
				$("#payStatus").val("REFUND_COMPLETE");
			}
		}
		_list.getList();
		_evInit();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='list'][data-act]").off();
		evo.on("click keyup", function(ev){
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
			if(act_v == "clickSearch") { // 검색
				event.clickSearch();
			} else if(act_v == "clickApproveBtn") { // 승인완료 버튼 클릭 > 승인 거부 사유 입력 모달
				event.clickApproveBtn(evo);
			} else if(act_v == "clickRejectBtn") { // 승인거부 버튼 클릭 > 승인 거부 사유 확인 및 수정 모달
				event.clickRejectBtn(evo);
			} else if(act_v == "clickReject") { // 승인거부 사유 입력 후 거부
				event.clickReject();
			} else if(act_v == "clickRejectModify") { // 승인거부 사유 수정
				event.clickRejectModify();
			} else if(act_v == "clickApproveWait") { // 승인대기 클릭
				event.clickApproveWait(evo);
			} else if(act_v == "clickId") { // 광고주 로그인
				event.clickId(evo);
			} else if(act_v == "clickPayStatus") { // 입금 상태 클릭
				event.clickPayStatus(evo);
			} else if(act_v == "modifyPayStatus") { // 입금 상태 > 내용수정 클릭
				event.modifyPayStatus();
			} else if(act_v == "clickDetail") {
				event.clickDetail(evo);
			}
		} else if(type_v == "keyup") {
			if(act_v == "inputSearch") {
				if(ev.keyCode === 13) {
					_list.getList();
				}
			}
		}
	}
	
	// 이벤트 담당
	let _event = {
		// 검색
		clickSearch: function() {
			_list.getList();
		},
		
		// 승인 완료 버튼 클릭
		clickApproveBtn: function(evo) {
			let tr_o = evo.parents("tr");
			let sgId = tr_o.attr("data-sg-id");
			let sgStatus = tr_o.attr("data-status");
			let sgProgress = tr_o.attr("data-sg-progress");
			
			$("#rejectReason").attr({
				"data-sg-id": sgId,
				"data-status": sgStatus,
			}).val("");
			
			if(sgStatus != 0 && sgStatus != 9 && sgProgress == "true") {
				// 이미 진행된 광고일 경우 거부 불가
				customModal.alert({
					content: "이미 진행된 광고는 거부하실 수 없습니다."
				});
				return;
			}
			
			$("#rejectReasonModal").modal("show");
		},
		
		// 승인 거부 버튼 클릭
		clickRejectBtn: function(evo) {
			let tr_o = evo.parents("tr");
			let sgId = tr_o.attr("data-sg-id");
			
			$("#modifyRejectReason").attr({
				"data-sg-id": sgId
			}).val($(evo).parents("tr").attr("data-reject-reason"));
			$("#rejectReasonModifyModal").modal("show");
		},
		
		// 승인거부 사유 입력 후 거부
		clickReject: function() {
			let evo = $("#rejectReason");
			let sgId = evo.attr("data-sg-id");
			let rejectReason = evo.val();

			if(util.valNullChk(rejectReason)) {
				customModal.alert({
					content: "승인거부 사유를 입력해주세요."
				});	
				return;
			}
			
			let url_v = "/sg/approvalStatus/modify";
			
			let data_v = {
				"sg_id": sgId,
				"approval": "N",
				"reject_reason": rejectReason,
			}
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					_list.getList();
					$("#rejectReasonModal").modal("hide");
				}
			});
		},
		
		// 승인거부 사유 수정
		clickRejectModify: function() {
			let evo = $("#modifyRejectReason");
			
			let url_v = "/sg/rejectReason/modify";
				
			let data_v = {
				"sg_id": evo.attr("data-sg-id"),
				"reject_reason": evo.val()
			}
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					$("#rejectReasonModifyModal").modal("hide");
					_list.getList();
				}
			});
		},
		
		// 입금 상태 클릭
		clickPayStatus: function(evo) {
			let tr_o = $(evo).parents("tr");
			let paySatus = tr_o.attr("data-pay-status");
			let select_o = $("#payStatusSelect").empty();
			
			$("#payNotes").attr({
				"data-sg-id": tr_o.attr("data-sg-id"),
				"data-pay-status": paySatus,
			}).val(util.unescapeData(tr_o.attr("data-reject-reason")));

			// 셀렉트박스			
			if(paySatus == "PAY_COMPLETE" || paySatus == "REFUND_WAIT") {
				select_o.append(new Option("입금 완료", "PAY_COMPLETE"));
				select_o.append(new Option("환불 대기", "REFUND_WAIT"));
				select_o.append(new Option("환불 완료", "REFUND_COMPLETE"));
			} else if(paySatus == "REFUND_COMPLETE") {
				select_o.append(new Option("환불 대기", "REFUND_WAIT"));
				select_o.append(new Option("환불 완료", "REFUND_COMPLETE"));
			} else if(paySatus == "PAY_WAIT") {
				select_o.append(new Option("입금 대기", "PAY_WAIT"));
				select_o.append(new Option("입금 완료", "PAY_COMPLETE"));
				select_o.append(new Option("환불 대기", "REFUND_WAIT"));
				select_o.append(new Option("환불 완료", "REFUND_COMPLETE"));
			}
			$("#payStatusSelect").selectpicker("refresh");
			$("#payStatusSelect").val(paySatus);
			
			// 금액
			$("#price").html("\\" + tr_o.attr("data-price"));
			
			$("#payStatusSelect").selectpicker("refresh");
			$("#depositModal").modal("show");
		},
		
		// 입금 상태 변경 실행
		modifyPayStatus: function() {
			let evo = $("#payNotes");
			let sgId = evo.attr("data-sg-id");
			let nowPayStatus = evo.attr("data-pay-status");
			let changePayStatus = $("#payStatusSelect option:selected").val();
			
			if(nowPayStatus == changePayStatus) {
				customModal.alert({
					content: "동일한 입금상태입니다."
				});
			} else {
				let url_v = "/sg/payStatus/modify";
					
				let data_v = {
					"sg_id": sgId,
					"pay_status_code": changePayStatus,
					"reject_reason": evo.val(), 
				}
				
				comm.send(url_v, data_v, "POST", function(resp) {
					if(resp) {
						$("#depositModal").modal("hide");
						_list.getList();
					}
				});
			}
		}, 
		
		// 상세보기
		clickDetail: function(evo) {
			location.href = "/campaign/inspection/detail?id=" + evo.attr("data-sg-id");	
		},
 		
		// 광고주 로그인
		clickId: function(evo) {
			let memberId = evo.attr("data-member-id");
			let memberUid = evo.attr("data-member-uid");
			let memberUtype = evo.attr("data-member-utype");
			util.staffLogin({
				memberId,
				memberUid,
				memberUtype,
			});
		},
		
		// 승인대기 클릭
		clickApproveWait: function(evo) {
			let tr_o = $(evo).parents("tr");
			location.href = "/campaign/inspection/detail?id=" + tr_o.attr("data-sg-id");
		},
	}
	
	// 리스트
	let _list = {
		// 조회
		getList: function(curPage = 1, type) {
			let url_v = "/sg/list";
	
			let data_v = {};
			
			$("#payStatus").selectpicker("refresh");
			$("#sgStatus").selectpicker("refresh");
			
			// 검색 조건
			let payStatus_v = $("#payStatus option:selected").val();
			if(!util.valNullChk(payStatus_v)) {
				data_v.pay_status_code = payStatus_v;
			}
			
			let sgStatus_v = $("#sgStatus option:selected").val();
			if(!util.valNullChk(sgStatus_v)) {
				data_v.status = sgStatus_v;
			}
			
			let sgName_v = $("#sgName").val();
			if(!util.valNullChk(sgName_v)) {
				data_v.sg_name = sgName_v;
			}
			
			let pageOption = {
				"limit": 20
			}
			
			let page_o = $("#listPage").customPaging(pageOption, function(_curPage){
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			if(pageParam) {
				data_v.offset = pageParam.offset;
				data_v.limit = pageParam.limit;
			}	
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					dev.log(resp);
					_list.drawList(resp.list);
					page_o.drawPage(resp.tot_cnt);
					_evInit();
				}
			});
		},
		
		// 리스트 그리기		
		drawList: function(list) {
			let tbody_o = $("#listBody").empty();
			
			if(list && list.length > 0) {
				for (let item of list) {
					let tr_o = $("<tr>").attr({
						"data-sg-id": item.sg_id,
						"data-agency-id": item.agency_id,
						"data-demand-id": item.member_id,
						"data-status": item.status,
						"data-pay-status": item.pay_status_code,
						"data-reject-reason": item.reject_reason,
						"data-price": util.numberWithComma(item.price),
						"data-sg-progress": item.is_progress
					});
					tbody_o.append(tr_o);
					{
						// 소속 대행사
						let td_o = $("<td>");
						if(item.agency_id != 0) {
							let span_name_o = $("<span>").html(item.agency_name);
							let span_id_o = $("<span>");
							let a_o = $("<a>").attr({
								"href": "javascript:;",
								"data-src": "list",
								"data-act": "clickId",
								"data-member-id": item.agency_id,
								"data-member-uid": item.agency_uid,
								"data-member-utype": globalConfig.memberType.AGENCY.utype,
							}).html(item.agency_uid);
							span_id_o.append("(", a_o, ")");
							td_o.append(span_name_o, span_id_o);
						} else {
							td_o.html("-");
						}
						tr_o.append(td_o);
					}
					{
						// 광고주
						let td_o = $("<td>");
						let span_name_o = $("<span>").html(item.company_name);
						let span_id_o = $("<span>");
						let a_o = $("<a>").attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickId",
							"data-member-id": item.member_id,
							"data-member-uid": item.uid,
							"data-member-utype": globalConfig.memberType.DEMAND.utype,
						}).html(item.uid);
						
						span_id_o.append("(", a_o, ")");
						td_o.append(span_name_o, span_id_o);
						tr_o.append(td_o);
					}
					{
						// 과금타입
						let td_o = $("<td>").html(item.pay_type);
						tr_o.append(td_o);
					}
					{
						// 광고명
						let td_o = $("<td>");
						let a_o = $("<a>").attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickDetail",
							"data-sg-id": item.sg_id						
						}).html(item.name);
						td_o.append(a_o);
						tr_o.append(td_o);
					}
					{
						// 광고 신청 일자
						let td_o = $("<td>").html(item.request_date);
						tr_o.append(td_o);
					}
					{
						// 광고 시작 요청일
						let td_o = $("<td>").html(item.start_ymd);
						tr_o.append(td_o);
					}
					{
						// 광고 종료 요청일
						let td_o = $("<td>");
						if(item.end_ymd == 0) {
							td_o.html("잔액 소진 시");
						} else {
							td_o.html(item.end_ymd);
						}
						tr_o.append(td_o);
					}
					{
						// 집행 요청 금액
						let td_o = $("<td>").html("\\" + util.numberWithComma(item.price));
						tr_o.append(td_o);
					}
					{
						// 입금 상태
						let td_o = $("<td>");
						tr_o.append(td_o);
						
						let button_o = $("<button>").attr({
							"type": "button",
							"class": "btn btn-approved",
							"data-src": "list",
							"data-act": "clickPayStatus"
						});
						
						let payStatus = item.pay_status_code;
						if(payStatus == "PAY_WAIT") {
							button_o.html("입금 대기");
						} else if(payStatus == "PAY_COMPLETE") {
							button_o.html("입금 완료");
						} else if(payStatus == "REFUND_WAIT") {
							button_o.html("환불 대기");
						} else if(payStatus == "REFUND_COMPLETE") {
							button_o.html("환불 완료");
						}
						td_o.append(button_o);
					}
					{
						// 승인 현황
						let td_o = $("<td>");
						let button_o = $("<button>");
						if(item.status == 0) {
							button_o.attr({
								"class": "btn btn-approved",
								"data-src": "list",
								"data-act": "clickApproveWait"
							}).html("승인대기");
						} else if(item.status == 9) {
							button_o.attr({
								"type": "button",
								"class": "btn btn-refusal",
								"data-src": "list",
								"data-act": "clickRejectBtn"
							}).html("승인거부");
						} else {
							button_o.attr({
								"type": "button",
								"class": "btn btn-refusal",
								"data-src": "list",
								"data-act": "clickApproveBtn"
							}).html("승인완료");
						}
						td_o.append(button_o);
						tr_o.append(td_o);
					}
				}
			} else {
				let div_o = $("<div>").addClass("notnotnot").html("광고가 없습니다.");
				tbody_o.append(div_o);

				for(let i = 0; i < 11; i++) {
					let tr_o = $("<tr>");
					tbody_o.append(tr_o);
					
					for(let j = 0; j < 10; j++) {
						let td_o = $("<td>");
						tr_o.append(td_o);
					}
				}
			}
		}
	}
	return {
		init,
	}
	
})();