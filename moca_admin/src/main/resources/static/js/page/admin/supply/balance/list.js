/**
 * 매체관리 > 정산관리
 */
const balanceList = (function(){
	
	const _urlParam = util.getUrlParam();
	
	let _listData = null;
	let _startDt_o = null;
	let _endDt_o = null;
	
	function init() {
		_setDatePicker();
		if(!util.valNullChk(_urlParam)) {
			if(_urlParam.type == "OM") {
				_startDt_o.datepicker("setDate", moment(moment().subtract(1, "months").format("YYYY-MM-01")).toDate());
			}
		}
		_list.getList();
	}
	
	function _evInit() {
		let evo = $("[data-src='list'][data-act]").off();
		$(evo).on("click keyup", function(ev){
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
			} else if(act_v == "clickPay") {
				event.clickPay(evo);
			} else if(act_v == "clickSspId") {
				event.clickSspId(evo);
			}
		} else if (type_v == "keyup") {
			if(act_v == "inputSearch") {
				if(ev.keyCode === 13) {
					_list.getList();
				}
			}
		}
	}
	
	// datepicker 설정
	function _setDatePicker() {
		_startDt_o = customDatePicker.init("searchStartDate", {
			format: {
				toDisplay: (date, format, language) => {
					let d = new Date(date);
					return moment(d).format("YYYY-MM-DD");
				},
				toValue: (date, format, language) => {
					let d = new Date(date);
					return moment(d).format("YYYY-MM-DD");
				}
			}
		});
		
		_startDt_o.datepicker("setDate", new Date());
		
		_endDt_o = customDatePicker.init("searchEndDate", {
			format: {
				toDisplay: (date, format, language) => {
					let d = new Date(date);
					return moment(d).format("YYYY-MM-DD");
				},
				toValue: (date, format, language) => {
					let d = new Date(date);
					return moment(d).format("YYYY-MM-DD");
				}
			}
		});
		
		_endDt_o.datepicker("setDate", new Date());
	}
	
	// 목록 관련
	let _list = {
		// 목록 조회
		getList: (curPage = 1) => {
			
			let searchStartDt = $("#searchStartDate").val();
			let searchEndDt = $("#searchEndDate").val();
			
			if(util.getDiffDate(searchStartDt, searchEndDt, "months") >= 3) {
				customModal.alert({
					content: "최대 조회 기간은 3개월입니다."
				});
				return;
			}
			
			if(moment(searchStartDt).isAfter(searchEndDt)) {
				customModal.alert({
					content: "시작일이 종료일 이후일 수 없습니다."
				});
				return;
			}
			
			let url_v = "/balance/list";
			
			let data_v = {
				search_start_date: searchStartDt,
				search_end_date: searchEndDt,
				pay_status: $("#payStatus").val()
			};
			
			let searchType_v = $("#searchType").val();
			let searchValue_v = $("#searchValue").val();
			if(searchValue_v) {
				data_v.search_type = searchType_v;
				data_v.search_value = searchValue_v;
			}
			
			let page_o = $("#listPage").customPaging(null, (_curPage) => {
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			data_v = $.extend(true, data_v, pageParam);
			
			comm.send(url_v, data_v, "POST", function(resp){
				_listData = resp.list;
				_list.drawList(resp.list);
				page_o.drawPage(resp.tot_cnt);
				_evInit();
			});
		},
		
		// 목록 그리기
		drawList: (list) => {
			let list_o = $("#listDiv").html("");
			
			for(let item of list) {
				let button_o = $("<button>").attr({
					"type": "button",
				}).addClass("btn btn-block mb-2 text-left accordion-btn");
				list_o.append(button_o);
				
				let span_o = $("<span>").html(
					item.company_name + "(<a href='javascript:;' data-src='list' data-act='clickSspId' data-id='"+item.member_id+"' data-uid='"+item.member_uid+"'>" + item.member_uid + "</a>) | " + item.balance_year + "년 " + item.balance_month + "월 정산금 : " + util.numberWithComma(item.price) + " 원"
				);
				button_o.append(span_o);
				
				let pay_o = $("<span>").addClass("calculate-btn");
				button_o.append(pay_o);
				let payText = "";
				if(item.status === "R") {
					// 정산금 지급
					payText = "정산금 지급";
				} else {
					// 지급 완료
					payText = "지급 완료";
				}
				pay_o.html("<a href='javascript:;' data-src='list' data-act='clickPay' data-id='"+item.balance_info_id+"' data-status='" + item.status + "'>" + payText + "</a>");
			}
		},
	};
	
	// 정산금 지급 처리
	function _payCalculate(data) {
		let url_v = "/balance/pay/calculate";
		
		let data_v = {
			balance_info_id: data.balance_info_id,
		};
		
		comm.send(url_v, data_v, "POST", function(resp) {
			_list.getList();
		});
	}
	
	let _event = {
		// 정산금 지급 / 지급완료 버튼 클릭시 이벤트
		clickPay: (evo) => {
			let balanceInfoId = $(evo).attr("data-id");
			let item = _listData.filter((item) => item.balance_info_id == balanceInfoId)[0];
			
			let content = "<span>" + item.bank_name + " / " + item.bank_account_number + " / " + item.bank_account_holder + "</span><br/>" + item.balance_year + "년 " + item.balance_month + "월 정산금 : " + util.numberWithComma(item.price) + " 원";
			if(item.status === "R") {
				customModal.confirm({
					content,
					confirmText: "지급",
					confirmCallback: () => {
						_payCalculate(item)
					}
				});
			} else if(item.status === "C") {
				content += "<p>" + item.update_date_str + " 입금 완료</p>";
				customModal.alert({
					content,
				});
			}
		},
		
		// 매체 ID 클릭 이벤트
		clickSspId: (evo) => {
			// 매체 계정 로그인  
			let memberId = $(evo).attr("data-id");
			let memberUid = $(evo).attr("data-uid");
			let memberUtype= globalConfig.memberType.SUPPLY.utype;
			util.staffLogin({
				memberId,
				memberUid,
				memberUtype,
			});
		}
	}
	
	return {
		init,
	}
})();