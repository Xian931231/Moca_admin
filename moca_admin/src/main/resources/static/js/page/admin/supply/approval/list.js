const supplyApprovalList = (function () {
	
	// 해당 페이지 초기화 함수
	function init(){
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
			if(act_v == "clickSearch") {
				event.clickSearch();
			} else if(act_v == "clickStatusSearch") { // 승인상태 검색
				event.clickStatusSearch(evo);
			} else if(act_v == "clickStatus") { // 승인상태 버튼 클릭
				event.clickStatus(evo);
			} else if(act_v == "clickApprove") {
				event.clickApprove(evo);
			} else if(act_v == "clickImageView") {
				event.clickImageView(evo);
			}
		} else if(type_v == "keyup") {
			if(act_v == "inputSearch") {
				if(ev.keyCode === 13) {
					_list.getList();
				}
			}
		}
	}
	
	// 이벤트
	let _event = {
		// 검색
		clickSearch: function() {
			_list.getList();
		},
		
		// 승인상태 검색
		clickStatusSearch: function(evo) {
			$("#searchValue").attr({"data-status": evo.attr("data-status")});
			evo.find("button").addClass("active");
			evo.parents().siblings("li").find("button").removeClass("active");
			
			_list.getList();	
		},
		
		// 승인상태 버튼 클릭
		clickStatus: function(evo) {
			let tr_o = $(evo).parents("tr");
			let status = tr_o.attr("data-status");
			let companyName = tr_o.attr("data-company");
			let biznumImage = tr_o.attr("data-image");
			let biznumFileName = tr_o.attr("data-file-name");
			let balanceDay = tr_o.attr("data-balance-day");
			let balanceRate = tr_o.attr("data-balance-rate");
			let uname = tr_o.attr("data-uname");
			let notes = tr_o.attr("data-notes");
			$("#approveNotes").attr({"data-member-id": tr_o.attr("data-member-id")});

			$("a[name=imageLink]").attr({"data-link": globalConfig.getS3Url() + biznumImage});
			$("span[name=companyName]").html(companyName);
			$("input[name=biznumImage]").val(biznumFileName);
			
			if(util.valNullChk(balanceDay)) {
				$("span[name=balanceDate]").html("-");
			} else {
				$("span[name=balanceDate]").html(balanceDay);
			}
			if(util.valNullChk(balanceRate)) {
				$("span[name=balanceRate]").html("-");
			} else {
				$("span[name=balanceRate]").html(balanceRate);
			}
			$("span[name=supplyUname]").html(uname);
			$("textarea[name=approveNotes]").val(util.unescapeData(notes));

			if(status == "V") {
				$("#approveModal").modal("show");
			} else {
				$("#specModal").modal("show");
			} 
		},
		
		// 승인/거부
		clickApprove: function(evo) {
			let status = evo.attr("data-approve");
			
			let url_v = "/member/supply/approve";
			
			let data_v = {
				"member_id": $("#approveNotes").attr("data-member-id"),
				"status": status,
				"notes": $("textarea[name=approveNotes]").val()
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					$("#approveModal").modal("hide");
					_list.getList();
				}
			});
		},
		
		// 사업자 등록증 보기
		clickImageView: function(evo) {
			window.open(evo.attr("data-link"), "_blank", "width=522, height=740");
		},
	}
	
	// 리스트
	let _list = {
		getList: function(curPage = 1) {
			let searchValue_o = $("#searchValue");
			let searchValue_v = searchValue_o.val();
			
			let url_v = "/member/supply/approve/list";
	
			let data_v = {
				"status": searchValue_o.attr("data-status"),
			};
			
			if(!util.valNullChk(searchValue_v)) {
				data_v.company_name = searchValue_v;
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
		
		drawList: function(list) {
			let tbody_o = $("#tableList").empty();
			
			if(list && list.length > 0) {
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-member-id": item.member_id,
						"data-status": item.status,
						"data-company": item.company_name,
						"data-image": item.company_regnum_image,
						"data-file-name" : item.company_regnum_file_name,
						"data-balance-day": item.balance_day,
						"data-balance-rate": item.balance_rate,
						"data-uname": item.uname,
						"data-notes": item.notes,
					});
					tbody_o.append(tr_o);
					
					{
						// seq
						let td_o = $("<td>").html(item.seq);
						tr_o.append(td_o);
					}
					{
						// 매체명
						let td_o = $("<td>").html(item.company_name);
						tr_o.append(td_o);
					}
					{
						// ID
						let td_o = $("<td>").html(item.uid);
						tr_o.append(td_o);
					}
					{
						// 가입일시
						let td_o = $("<td>").html(item.insert_date);
						tr_o.append(td_o);
					}
					{
						// 처리일시
						let td_o = $("<td>");
						if(item.approve_process_date) {
							td_o.html(item.approve_process_date);
						} else {
							td_o.html("-");
						}
						tr_o.append(td_o);
					}
					{
						// 승인상태
						let td_o = $("<td>");
						let status = item.status;
						let statusText = "";
						let statusClass = "";
						
						if(status == "A") {
							statusText = "승인완료";
							statusClass = "btn btn-approved";
						} else if(status == "V") {
							statusText = "승인대기";
							statusClass = "btn btn-sm";
						} else if(status == "X") {
							statusText = "승인거부";
							statusClass = "btn btn-refusal";
						}
						
						let button_o = $("<button>").attr({
							"type": "button",
							"class": statusClass,
							"data-src": "list",
							"data-act": "clickStatus"
						}).html(statusText);
						
						td_o.append(button_o);
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