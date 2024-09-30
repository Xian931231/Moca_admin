const scheduleList = (function () {
	
	let _scheduleList = [];
	
	// 해당 페이지 초기화 함수
	function init(){
		_list.getList();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='scheduleList'][data-act]").off();
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
			if(act_v == "clickRemoveSchedule") {
				event.clickRemoveSchedule();
			} else if(act_v == "clickApplyProduct") {
				event.clickApplyProduct(evo);
			} else if(act_v == "clickMoveAddPage") {
				event.clickMoveAddPage();
			}
		} else if(type_v == "change") {
			if(act_v == "changeAllCheckbox") {
				util.setCheckBox(evo);
			}
		}
	}
	
	const _list = {
		getList: function(currPage = 1) {
			let url_v = "/campaign/schedule/list";
			
			let data_v = {};
			
			let page_o = $("#listPage").customPaging({limit:10}, function(_curPage){
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(currPage);
			
			if(pageParam) {
				data_v.offset = pageParam.offset;
				data_v.limit = pageParam.limit;
			}	
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					_scheduleList = resp.list;
					_list.drawList(resp.list);
					page_o.drawPage(resp.tot_cnt);
					_evInit();
				}
			});
		},
		
		drawList: function(list) {
			let body_o = $("#listBody").empty();
			let idx = 0;
			
			for(let item of list) {
				let tr_o = $("<tr>").attr({
					"data-idx" : idx++,
					"data-id"  : item.schedule_id
				});
				
				{
					// checkbox
					let td_o = $("<td>");
					let span_o = $("<span>").addClass("chk");
					let checkbox_o = $("<input>").attr({
						"type"		: "checkbox",
						"name"		: "scheduleCheck",
						"id"		: "scheduleCheck_" + idx,
					});
					let label_o = $("<label>").attr("for", "scheduleCheck_" + idx);
					
					span_o.append(checkbox_o);
					span_o.append(label_o);
					td_o.append(span_o);
					tr_o.append(td_o);				
				}
				{
					// 편성표 이름
					let td_o = $("<td>");
					let a_o = $("<a>").attr("href", "/campaign/schedule/modify?schedule_id=" + item.schedule_id).text(item.schedule_name);
					td_o.append(a_o);
					tr_o.append(td_o);
				}
				{
					// 총 슬롯 수
					let td_o = $("<td>").text(item.cpm_slot_count + item.cpp_slot_count);
					tr_o.append(td_o);
				}
				{
					// cpp 슬롯 수
					let td_o = $("<td>").text(item.cpp_slot_count);
					tr_o.append(td_o);
				}
				{
					// block 슬롯 수
					let td_o = $("<td>").text(item.cpm_slot_count);
					tr_o.append(td_o);
				}
				{
					// 등록일
					let td_o = $("<td>").text(item.insert_date);
					tr_o.append(td_o);
				}
				{
					// 적용된 상품
					let td_o = $("<td>");
					
					if(item.product_list && item.product_list.length > 0) {
						let btn_o = $("<button>").addClass("btn stateBox state-ongoing")
						.attr({
							"data-src"		: "scheduleList",
							"data-act" 		: "clickApplyProduct",
							"data-toggle" 	: "modal",
						}).text(item.product_list.length + "개");
						
						td_o.append(btn_o);
					} else {
						td_o.text("-");
					}
					tr_o.append(td_o);
				}
				body_o.append(tr_o);
			}
		},
		
		// 적용된 상품 
		drawProductList: function(list){
			let body_o = $("#productListBody").empty();
			
			for(let item of list) {
				let tr_o = $("<tr>");
				{
					// 상품명
					let td_o = $("<td>").text(item.company_name + " > " + item.category_name + " > " + item.product_name);
					tr_o.append(td_o);
					
				} 
				{
					// cpp 지정 순서 변경
					let a_o = $("<a>").attr("href", "/campaign/schedule/modify/order?product_id=" + item.product_id).text("지정 순서 변경");
					let td_o = $("<td>");
					td_o.append(a_o);
					tr_o.append(td_o);
				}
				body_o.append(tr_o);
			}
		}
	}
	
	// 이벤트 담당
	const _event = {
		// 편성표 등록 페이지 이동 
		clickMoveAddPage: function() {
			location.href = "/campaign/schedule/add";
		}, 
		
		// 편성표 삭제
		clickRemoveSchedule: function() {
			let scheduleIdList = [];
			
			$("input[name='scheduleCheck']").each(function(idx, obj){
				if($(obj).prop("checked")){
					let scheduleId = $(obj).parents("tr").attr("data-id");
					scheduleIdList.push(Number(scheduleId));
				}
			});
			
			if(scheduleIdList.length <= 0) {
				return false;
			}
			
			let url_v = "/campaign/schedule/remove";
			let data_v = {
				schedule_id_list: scheduleIdList,
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result){
					_list.getList();
				} else if(resp.code == 8003) {
					customModal.alert({
						content: "CPP 광고가 진행중인 편성표는 삭제하실 수 없습니다.",
					});
				}
			});
		},
		
		// 적용된 상품  
		clickApplyProduct: function(evo) {
			let idx = evo.parents("tr").attr("data-idx");
			
			let productList = _scheduleList[idx].product_list;
			
			_list.drawProductList(productList);
			
			$("#applyPdct").modal("show");
		}, 
	}
	
	return {
		init
	}
	
})();