/**
 * 관리자 > 매체관리 > 오류 광고 조회 
 */
const abnormalList = (function() {
	
	let startDt_o = null;
	let endDt_o = null;
	
	function init() {
		_setDatePicker();
		_list.getList();
	}
	
	function _evInit() {
		let evo = $("[data-src='list'][data-act]").off();
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
		_startDt_o = customDatePicker.init("searchStartDate", {
//			"format": {
//				toDisplay: (date, format, language) => {
//					let d = new Date(date);
//					return moment(d).format("YYYY-MM-dd");
//				},
//				toValue: (date, format, language) => {
//					let d = new Date(date);
//					return moment(d).format("YYYY-MM-dd");
//				}
//			}
		});
		
		_startDt_o.datepicker("setDate", moment().subtract(7, "days").toDate());
		
		_endDt_o = customDatePicker.init("searchEndDate", {
//			"format": {
//				toDisplay: (date, format, language) => {
//					let d = new Date(date);
//					return moment(d).format("YYYY-MM-dd");
//				},
//				toValue: (date, format, language) => {
//					let d = new Date(date);
//					return moment(d).format("YYYY-MM-dd");
//				}
//			}
		});
		
		_endDt_o.datepicker("setDate", moment().toDate());
	}
	
	let _list = {
		getList: (curPage = 1) => {
			let url_v = "/sg/error/ssp/list";
			
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
			
			let data_v = {
				search_start_date: searchStartDt,
				search_end_date: searchEndDt,
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
				console.log(resp);
				_evInit();
				_list.drawList(resp.list);
				page_o.drawPage(resp.tot_cnt);
			});
		},
		
		drawList: (list) => {
			let tbody_o = $("#listBody").html("");
			
			for(let item of list) {
				let tr_o = $("<tr>").attr({
					
				});
				tbody_o.append(tr_o);
				
				// 날짜
				{
					let td_o = $("<td>").html(item.event_date_str);
					tr_o.append(td_o);
				}
				// 매체 
				{
					let td_o = $("<td>").html(item.company_name);
					tr_o.append(td_o);
				}
				// 분류
				{
					let td_o = $("<td>").html(item.category_name);
					tr_o.append(td_o);
				}
				// 상품명
				{
					let td_o = $("<td>").html(item.product_name);
					tr_o.append(td_o);
				}
				// 디바이스 S/N
				{
					let td_o = $("<td>").html(item.device_serial_number);
					tr_o.append(td_o);
				}
				// 과금
				{
					let td_o = $("<td>").html(item.pay_type);
					tr_o.append(td_o);
				}
				// 광고명
				{
					let td_o = $("<td>").html(item.sg_name);
					tr_o.append(td_o);
				}
				// 영상
				{
					let td_o = $("<td>").html(item.exposure_time);
					tr_o.append(td_o);
				}
				// 재생시작
				{
					let td_o = $("<td>").html(item.display_start_time_str || "-");
					tr_o.append(td_o);
				}
				// 재생종료
				{
					let td_o = $("<td>").html(item.display_end_time_str || "-");
					tr_o.append(td_o);
				}
				// 오차
				{
					let text = "-";
					if(item.display_diff_time_str && item.error_kind === "E") {
						text = item.display_diff_time_str;
					}
					let td_o = $("<td>").html(text);
					tr_o.append(td_o);
				}
				// 상태
				{
					let td_o = $("<td>");
					tr_o.append(td_o);
					
					if(item.error_kind === "A") {
						td_o.css("color", "red").html("이상");
					} else {
						td_o.html("오류");
					}
				}
			}
		}
	}
	
	let _event = {
			
	};
	
	return {
		init
	}
})();