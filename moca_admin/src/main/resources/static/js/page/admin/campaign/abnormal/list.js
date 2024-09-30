const abnormalList = (function() {
		
	let _logList = [];
	
	function init() {
		_setDatePicker();
		_initErrorProcessModal();
		_list.getList();
	}
	
	function _evInit() {
		let evo = $("[data-src='abnormalList'][data-act]").off();
		evo.on("click keyup", function(ev) {
			_action(ev);
		});
	}
	
	function _action(ev) {
		let evo = $(ev.currentTarget);
		
		let type_v = ev.type;
		
		let act_v = evo.attr("data-act");
		
		let event = _event;
		
		if(type_v == "click") {
			if(act_v == "clickSearch") {
				_list.getList();
			} else if(act_v == "clickSearchStatus") {
				event.clickSearchStatus(evo);
			} else if(act_v == "clickErrorProcessModal") {
				event.clickErrorProcessModal(evo);
			} else if(act_v == "clickErrorEndModal") {
				event.clickErrorEndModal(evo);
			} else if(act_v == "clickModifyLogStatus") {
				event.clickModifyLogStatus();
			} else if(act_v == "clickId") {
				event.clickId(evo);
			}
		} else if(type_v == "keyup") {
			if(act_v == "inputSearch") {
				if(ev.keyCode === 13) {
					_list.getList();
				}
			}
		}
	}	
	
	// datepicker 설정
	function _setDatePicker() {
		// 시작
		customDatePicker.init("searchStartDate").datepicker("setDate", moment().subtract(7, "days").toDate());
		// 종료
		customDatePicker.init("searchEndDate").datepicker("setDate", moment().toDate());;
	}
	
	const _list = {
		getList: function(curPage) {
			let data_v = _list.getSearchData();
			
			if(!_list.validateSearchData(data_v)) {
				return;
			}
			
			let url_v = "/sg/error/list";
			
			let page_o = $("#listPage").customPaging(null, function(_curPage) {
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			data_v = $.extend(true, data_v, pageParam);
			
			comm.send(url_v, data_v, "POST", function(resp){
				_logList = resp.list;
				_list.drawList(resp.list);
				page_o.drawPage(resp.tot_cnt);
				_evInit();
			});
		},
		
		drawList: function(list) {
			let tbody_o = $("#listBody").html("");
			
			$.each(list, function(idx, item) {	
				let tr_o = $("<tr>");
				{
					// 소속 대행사
					let agentCompanyName = item.agency_company_name;
					let td_o = $("<td>");
					tr_o.append(td_o);
					
					if(agentCompanyName) {
						let nameSpan_o = $("<span>").text(agentCompanyName);
						td_o.append(nameSpan_o);
						
						let idSpan_o = $("<span>");
						td_o.append(idSpan_o);
						
						let a_o = $("<a>").attr({
							"href"			 	: "javascript:;",
							"data-src" 		 	: "abnormalList",
							"data-act"		 	: "clickId",
							"data-member-id" 	: item.agency_id,
							"data-member-uid"	: item.agency_uid,
							"data-member-utype" : globalConfig.memberType.AGENCY.utype,
						}).text(item.agency_uid);
						idSpan_o.append("(", a_o, ")");
					} else {
						td_o.text("-");
					}
				}
				{
					// 광고주
					let td_o = $("<td>");
					tr_o.append(td_o);
					
					let nameSpan_o = $("<span>").text(item.demand_company_name);
					td_o.append(nameSpan_o);
					
					let idSpan_o = $("<span>");
					td_o.append(idSpan_o);
					
					let a_o = $("<a>").attr({
						"href"			 	: "javascript:;",
						"data-src" 		 	: "abnormalList",
						"data-act"		 	: "clickId",
						"data-member-id" 	: item.demand_id,
						"data-member-uid"	: item.demand_uid,
						"data-member-utype" : globalConfig.memberType.DEMAND.utype,
					}).text(item.demand_uid);
					idSpan_o.append("(", a_o, ")");
				}
				{
					// 과금 방식
					let td_o = $("<td>").text(item.pay_type);
					tr_o.append(td_o);
				}
				{
					// 광고 명
					let td_o = $("<td>");
					tr_o.append(td_o);
					
					let a_o = $("<a>").attr({
						"href"			 	: "javascript:;",
						"data-src" 		 	: "abnormalList",
						"data-act"		 	: "clickId",
						"data-member-id" 	: item.demand_id,
						"data-member-uid" 	: item.demand_uid,
						"data-member-utype" : globalConfig.memberType.DEMAND.utype,
						"data-sg-id"	 : item.sg_id,
					}).text(item.sg_name);
					td_o.append(a_o);
				}
				{
					// 날짜
					let td_o = $("<td>").text(item.event_date_str);
					tr_o.append(td_o);
				}
				{
					// 재생 시작
					let td_o = $("<td>").text(item.display_start_time_str ? item.display_start_time_str : "-");
					tr_o.append(td_o);
				}
				{
					// 재생 종료
					let td_o = $("<td>").text(item.display_end_time_str ? item.display_end_time_str : "-");
					tr_o.append(td_o);
				}
				{
					// 오차
					let td_o = $("<td>").text(item.error_kind == "E" ? item.display_diff_time_str : "-");
					tr_o.append(td_o);
				}
				{
					// 상태
					let td_o = $("<td>");
					tr_o.append(td_o);
					
					let span_o = $("<span>").addClass(item.error_kind == "A" ? "colorRed" : "")
						.text(item.error_kind == "A" ? "이상" : "오류");
					td_o.append(span_o);
				}
				{
					// 처리여부
					let td_o = $("<td>");
					tr_o.append(td_o);
										
					let btn_o = $("<button>").addClass(item.log_status == "E" ? "btn btn-approved" : "btn btn-refusal").attr({
							"href"			: "javascript:;",
							"data-src" 		: "abnormalList",
							"data-act"		: item.log_status == "E" ? "clickErrorProcessModal" : "clickErrorEndModal",
							"data-status"	: item.log_status,
							"data-idx"		: idx,
						}).text(item.log_status == "E" ? "미처리" : "처리완료");
					td_o.append(btn_o);
				}
				tbody_o.append(tr_o);
			});
		},
		
		// 검색 데이터
		getSearchData: function() {
			let data_v = {};
			
			// 시작 날짜
			data_v.search_start_date =  $("#searchStartDate").val();
			
			// 종료 날짜
			data_v.search_end_date = $("#searchEndDate").val();
			
			// 검색 타입
			data_v.search_type = $("#searchType").val();
			
			// 검색어
			data_v.search_value = $("#searchValue").val();
			
			// 처리 여부
			data_v.log_status = $("#statusGroup button.active").val();
			
			return data_v;
		},
		
		// 검색 유효성 검사
		validateSearchData: function(data) {
			if(util.getDiffDate(data.search_start_date, data.search_end_date, "months") >= 3) {
				customModal.alert({
					content: "최대 조회 기간은 3개월입니다."
				});
				return false;
			}
			
			if(moment(data.search_start_date).isAfter(data.search_end_date)) {
				customModal.alert({
					content: "시작일이 종료일 이후일 수 없습니다."
				});
				return false;
			}
			return true;
		}
	}
	
	const _event = {
		// 상태 검색
		clickSearchStatus: function(evo) {
			$("#statusGroup").find("button.active").removeClass("active");
			evo.addClass("active");
			_list.getList();
		},
		
		// 에러 처리 완료 모달
		clickErrorEndModal: function(evo) {
			let status = evo.attr("data-status");
			let idx = Number(evo.attr("data-idx"));
			let log = _logList[idx];
			
			// 처리자
			$("#processMemeberTxt").text(log.process_uname + "(" + log.process_uid + ")");
			// 발생내용
			$("#logContentTxt").text(log.log_content);
			// 처리방법
			$("#processKindTxt").text(log.process_kind == "E" ? "오류 처리" : "정상 처리");
			// 처리내용
			$("#processContentTxt").text(log.process_content);
			
			$("#errEndModal button[data-act='clickErrorProcessModal']").attr({
				"data-idx"		: idx,
				"data-status"	: status,
			});
			
			$("#errEndModal").modal("show");
		},
		
		// 에러 처리 모달
		clickErrorProcessModal: function(evo) {
			let status = evo.attr("data-status");
			let idx = Number(evo.attr("data-idx"));
			let log = _logList[idx];
			
			// 수정 시
			if(status == "R") {
				// 발생내용
				$("#logContent").val(log.log_content);
				// 처리방법
				$("#processKind").selectpicker("val", log.process_kind);
				// 처리내용
				$("#processContent").val(log.process_content);
				
				$("#errEndModal").modal("hide");
			}
			$("#adEventLogId").val(log.ad_event_log_id);
			
			$("#errProcessModal").modal("show");		
		},
		
		// 로그 상태 변경
		clickModifyLogStatus: function() {
			let url_v = "/sg/error/modify/status";                                                        
			
			let data_v = {
				ad_event_log_id : $("#adEventLogId").val(),
				log_content		: $("#logContent").val(),
				process_kind	: $("#processKind").val(),
				process_content	: $("#processContent").val(),
			}

			if(data_v.process_kind == "E") {
				data_v.log_status = "N";
			} else {
				data_v.log_status = "R";
			}
			
			if(!_validateModifyStatusData(data_v)) {
				return false;
			}
			
			comm.send(url_v, data_v, "POST", function(resp){
				if(resp.result) {
					_list.getList();
					$("#errProcessModal").modal("hide");
				}
			});
		},

		// 로그인
		clickId: function(evo) {
			let memberId = evo.attr("data-member-id");
			let memberUid = evo.attr("data-member-uid");
			let memberUtype = evo.attr("data-member-utype");
			
			let callbackUrl = "/";
			let sgId = evo.attr("data-sg-id");
			if(sgId) {
				callbackUrl = "/demand/campaign/sg/detail?id=" + sgId;
			}
			
			util.staffLogin({
				memberId,
				memberUid,
				memberUtype,
				callbackUrl,
			});
		}
	};
	
	// 로그 상태 변경 데이터 유효성 검사
	function _validateModifyStatusData(data) {
		if(!data.log_content || !data.process_content) {
			customModal.alert({
				content: "입력되지 않은 항목이 있습니다.",
			});
			return false;
		}
		return true;
	}
	
	// 에러처리 모달 초기화
	function _initErrorProcessModal() {
		$("#errProcessModal").on("hidden.bs.modal", function (e) {
			  $("#logContent").val("");
			  $("#processKind").selectpicker("val", "E");
			  $("#processContent").val("");
		});
	}
	
	return {
		init
	}
})();