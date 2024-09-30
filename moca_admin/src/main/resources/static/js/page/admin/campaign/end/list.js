const endList = (function() {
		
	let _stopSgList = [];
	
	function init() {
		_setDatePicker();
		_list.getList();
	}
	
	function _evInit() {
		let evo = $("[data-src='endList'][data-act]").off();
		evo.on("click change", function(ev) {
			_action(ev);
		});
	}
	
	function _action(ev) {
		let evo = $(ev.currentTarget);
		
		let type_v = ev.type;
		
		let act_v = evo.attr("data-act");
		
		let event = _event;
		
		if(type_v == "click") {
			if(act_v == "clickId") {
				event.clickId(evo);
			} else if(act_v == "clickSearch") {
				_list.getList();
			} else if(act_v == "clickStopReason") {
				event.clickStopReason(evo);
			}
		} else if(type_v == "change") {
			if(act_v == "changeEndReasonSearch") {
				_list.getList();
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
				return false;
			}
			
			let url_v = "/sg/end/list";
			
			let page_o = $("#listPage").customPaging(null, function(_curPage) {
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			data_v = $.extend(true, data_v, pageParam);
			
			comm.send(url_v, data_v, "POST", function(resp){
				_stopSgList = resp.list;
				_list.drawList(resp.list);
				page_o.drawPage(resp.tot_cnt);
				_evInit();
				$(".selectpicker").selectpicker("refresh");
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
							"href"				: "javascript:;",
							"data-src" 			: "endList",
							"data-act"			: "clickId",
							"data-member-id"	: item.agency_id,
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
						"href"				: "javascript:;",
						"data-src" 			: "endList",
						"data-act"			: "clickId",
						"data-member-id"	: item.demand_id,
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
						"href"				: "javascript:;",
						"data-src" 			: "endList",
						"data-act"			: "clickId",
						"data-member-id"	: item.demand_id,
						"data-member-uid"	: item.demand_uid,
						"data-member-utype" : globalConfig.memberType.DEMAND.utype,
						"data-sg-id"		: item.sg_id,
					}).text(item.sg_name);
					td_o.append(a_o);
				}
				{
					// 노출량
					let td_o = $("<td>").text(util.numberWithComma(item.total_count));
					tr_o.append(td_o);
				}
				{
					// 종료 일시
					let td_o = $("<td>").text(item.sg_end_date ? item.sg_end_date : "-");
					tr_o.append(td_o);
				}
				{
					// 종료 사유
					let td_o = $("<td>"); 
					
					let status = item.status;
					let stopReason = "";
					if(status == 8) { // 정상 종료
						stopReason = item.pay_type == "CPP" ? "기간 종료" : "목표 노출수 도달";
						td_o.text(stopReason);
						
					} else if(status == 7) { // 긴급 종료
						stopReason = "긴급 종료";
						let a_o = $("<a>").attr({
							"href" 		: "javascript:;",
							"data-idx"  : idx,
							"data-src" 	: "endList",
							"data-act"	: "clickStopReason",
						}).text(stopReason);
						td_o.append(a_o);
					}
					tr_o.append(td_o);
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
			
			// 종료 사유
			data_v.end_reason_type = $("#endReasonType").val();
			
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
		// 종료 사유 변경 시
		changeEndReason: function() {
			_list.getList();
		},
		
		// 긴급 종료 사유
		clickStopReason: function(evo) {
			let idx = Number(evo.attr("data-idx"));
			let stopSg = _stopSgList[idx];
			
			$("#stopReason").text(util.unescapeData(stopSg.stop_reason));
			
			$("#stopReasonModal").modal("show");
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
	
	return {
		init
	}
})();