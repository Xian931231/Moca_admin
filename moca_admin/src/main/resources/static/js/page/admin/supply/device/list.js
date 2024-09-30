const deviceList = (function(){
	
	// 서버에서 불러온 모든 디바이스 리스트
	let _allDeviceList = [];
	
	let _pageNo = 1;
	
	function init() {
		_list.getList();
	}
	
	function _evInit() {
		let evo = $("[data-src='deviceList'][data-act]").off();
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
				event.clickSearch();
			} else if(act_v == "clickStatusSearch") {
				event.clickStatusSearch(evo);
			} else if(act_v == "clickDeviceStatus") {
				event.clickDeviceStatus(evo);
			} else if(act_v == "clickChangeDeviceStatus") {
				event.clickChangeDeviceStatus(evo);
			} else if(act_v == "clickSspId") {
				event.clickSspId(evo);
			}
		} else if(type_v == "keyup") {
			if(act_v == "keyupSearch") {
				if(act_v == "keyupSearch") {
					if(ev.keyCode == 13) {
						event.clickSearch();
					}
				}
			}
		} 
	}
		
	// 목록 관련
	const _list = {
		// 목록 조회
		getList: function(curPage = 1, clickTargetIdx) {
			_pageNo = curPage;
			
			let url_v = "/device/withMotorList";
			
			let data_v = _list.getSearchData();
			
			let page_o = $("#listPage").customPaging({limit: 10}, function(_curPage) {
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			data_v = $.extend(true, data_v, pageParam);
			
			comm.send(url_v, data_v, "POST", function(resp){
				if(resp.result) {
					_allDeviceList = [];
					_list.drawList(resp.list, clickTargetIdx);
					page_o.drawPage(resp.tot_cnt);
					_evInit();
				}
			});
		},
		
		// 목록 그리기
		drawList: function(list, clickTargetIdx = null) {
			let list_o = $("#accoTableList").empty();
			
			if(list && list.length > 0) {
				$("#pageNavigation").removeClass("d-none");
				$("#accoTableWrap").removeClass("blank");
				$("#accoTableList").removeClass("notnotnot");
				
				// 디바이스 상태
				let deviceStatus = $("#statusGroup button.active").val();
				let deviceStatusTxt = deviceStatus == "R" ? "수리중" : deviceStatus == "D" ? "폐기" : "정상";
				
				$.each(list, function(i, item){
					{
						// 매체사 collapse 버튼
						let button_o = $("<button>").addClass("btn btn-block mb-2 text-left accordion-btn")
							.attr({
								"type"			: "button",
								"data-toggle"	: "collapse",
								"data-target"	: "#accoT" + i,
								"aria-expanded" : clickTargetIdx === i ? true : false,
							});
	
						list_o.append(button_o);
						
						let span_o = $("<span>").text(item.company_name);
						button_o.append(span_o);
	
						let a_o = $("<a>").attr({
								"data-src"	: "deviceList",
								"data-act"	: "clickSspId",
								"data-id"	: item.member_id,
								"data-uid"	: item.uid,
								"data-utype": globalConfig.memberType.SUPPLY.utype,
								"href"		: "javascript:;"
							}).text(item.uid);
						span_o.append("(", a_o, ")");
						
						let wrapSpan_o = $("<span>");
						button_o.append(wrapSpan_o);
						
						// 디바이스 상태
						let deviceStatusCnt = deviceStatus == "R" ? item.repair_cnt : deviceStatus == "D" ? item.dispose_cnt : item.normal_cnt;
						let statusSpan_o = $("<span>").text(deviceStatusTxt + " " + deviceStatusCnt + " / ");
						wrapSpan_o.append(statusSpan_o);
						
						let totCntSpan_o = $("<span>").text("디바이스 " + item.total_cnt);  
						wrapSpan_o.append(totCntSpan_o);
					}
					{
						// collapse div
						let collapDiv_o = $("<div>").addClass(clickTargetIdx === i ? "collapse show" : "collapse")
							.attr({
								"id"			: "accoT" + i,
								"data-parent"	: "#accoTableList"
							});
						list_o.append(collapDiv_o);
						
						let wrapDiv_o = $("<div>").addClass("tableWrap");
						collapDiv_o.append(wrapDiv_o);
						
						let tableDiv_o = $("<div>").addClass("tableInner device advTable4");
						wrapDiv_o.append(tableDiv_o);
						
						{
							// table
							let table_o = $("<table>").addClass("table");
							tableDiv_o.append(table_o);
							
							let colgroup_o = $("<colgroup>");
							table_o.append(colgroup_o);
							
							let col1_o = $("<col>").attr("width", "150px");
							let col2_o = $("<col>").attr("width", "220px");
							let col3_o = $("<col>").attr("width", "130px");
							let col4_o = $("<col>").attr("width", "150px");
							let col5_o = $("<col>").attr("width", "100px");
							let col6_o = $("<col>").attr("width", "200px");
							let col7_o = $("<col>").attr("width", "*");
							colgroup_o.append(col1_o, col2_o, col3_o, col4_o, col5_o, col6_o, col7_o)
							
							// thead
							let thead_o = $("<thead>");
							table_o.append(thead_o);
							
							let tr_o = $("<tr>");
							thead_o.append(tr_o);
							
							let th1_o = $("<th>").text("게재 위치");
							let th2_o = $("<th>").text("상품");
							let th3_o = $("<th>").text("S/N");
							let th4_o = $("<th>").text("화면규격");
							let th5_o = $("<th>").text("슬롯수");
							let th6_o = $("<th>").text("등록일시");
							let th7_o = $("<th>").text("상태");
							tr_o.append(th1_o, th2_o, th3_o, th4_o, th5_o, th6_o, th7_o);
							
							// tbody
							let tbody_o = $("<tbody>");
							table_o.append(tbody_o);
							
							// 게재위치
							if(item.motor_list && item.motor_list.length > 0) {
								for(let motor of item.motor_list) {
									let deviceList = motor.device_list;
									
									// 디바이스 정보
									$.each(deviceList, function(idx, device) {
										_allDeviceList.push(device);
										
										let tr_o = $("<tr>");
										
										tbody_o.append(tr_o);
										{
											if(idx == 0) {
												// 게재위치 명
												let td_o = $("<td>").attr("rowspan", deviceList.length).text(motor.car_number);
												tr_o.append(td_o);
											}
										}
										{
											// 상풍 이름 
											let td_o = $("<td>").text(device.product_name);
											tr_o.append(td_o);
										}
										{
											// 시리얼 번호
											let td_o = $("<td>").text(device.serial_number);
											tr_o.append(td_o);
										}
										{
											// 화면 규격
											let td_o = $("<td>").text(device.screen_resolution ? device.screen_resolution : "-");
											tr_o.append(td_o);
										}
										{
											// 슬롯수
											let td_o = $("<td>").text(device.slot_cnt ? device.slot_cnt : "-");
											tr_o.append(td_o);
										}
										{
											// 등록 일시
											let td_o = $("<td>").text(device.insert_date);
											tr_o.append(td_o);
										}
										{
											// 상태
											let status = device.status == "R" ? "수리중" : device.status == "D" ? "폐기" : "정상";
											let td_o = $("<td>")
											tr_o.append(td_o);
											
											let a_o = $("<a>").attr({
												"data-src"		: "deviceList",
												"data-act"		: "clickDeviceStatus",
												"data-list-idx" : i,
												"data-device-id": device.device_id,
												"href"	  		: "javascript:;"
											}).text(status);
											td_o.append(a_o);
										}
									});
								}
							} else {
								// 상품 없는 메시지
								let div_o = $("<div>").addClass("notnotnot").text("상품이 없습니다.");
								wrapDiv_o.prepend(div_o);
								
								let tr_o = $("<tr>");
								tbody_o.append(tr_o);
								
								for(let i = 0; i < 7; i++) {
									tr_o.append("<td>");
								}
							}
						}
					}
				});
			} else {
				$("#pageNavigation").addClass("d-none");
				$("#accoTableWrap").addClass("blank");
				$("#accoTableList").addClass("notnotnot").text("검색 결과가 없습니다.");
			}
		},
		
		// 검색 데이터
		getSearchData: function() {
			let data_v = {};
			
			let deviceStatus = $("#statusGroup button.active").val();
			if(deviceStatus) {
				data_v.status = deviceStatus;
			}
			
			let searchValue = $("#searchValue").val().trim();
			if(searchValue) {
				data_v.search_value = searchValue;
				
				let searchType = $("#searchType").val();
				data_v.search_type = searchType;
			}
			
			return data_v;
		}
	};
	
	const _event = {
		// 검색
		clickSearch: function() {
			_list.getList();
		},
		
		// 상태 검색 클릭
		clickStatusSearch: function(evo) {
			$("#statusGroup").find("button.active").removeClass("active");
			evo.addClass("active");

			_list.getList();
		},	
		
		// 디바이스 상태 클릭
		clickDeviceStatus: function(evo) {
			let deviceId = Number(evo.attr("data-device-id"));
			
			// 선택한 디바이스 정보
			let device = _allDeviceList.filter(device => device.device_id == deviceId)[0];
			
			$("#notes").val(util.unescapeData(device.notes));
			$("#deviceStatus").selectpicker("val", device.status);
			
			$("[data-act='clickChangeDeviceStatus']").attr("data-device-id", deviceId);
			
			$("#deviceStatusModal").modal("show");
		},
			
		// 디바이스 상태 변경
		clickChangeDeviceStatus: function(evo) {
			let notes = $("#notes").val();
			let deviceId = evo.attr("data-device-id");
			let status = $("#deviceStatus").val();
			
			if(!deviceId && !status) {
				return false;
			}
			
			if(!notes) {
				customModal.alert({
					content: "변경 사유가 입력되지 않았습니다.",
				});
					
				return false;
			}
			
			let url_v = "/device/modify/status";
			
			let data_v = {
				"ssp_device_id"	: deviceId,
				"status"		: status
			};
			if(notes){
				data_v.notes = notes;
			}
			
			comm.send(url_v, data_v, "POST", function(resp){
				if(resp.result) {
					$("#deviceStatusModal").modal("hide");
					
					// 상태 변경 후 해당 매체 아코디언 펼쳐지도록 하기 위함
					let clickTargetIdx = $("#accoTableList a[data-device-id=" + deviceId + "]").attr("data-list-idx");

					_list.getList(_pageNo, Number(clickTargetIdx));
				}
			});
		},
		
		// 매체 ID 클릭 
		clickSspId: function(evo) {
			// 매체 계정 로그인  
			let memberId = evo.attr("data-id");
			let memberUid = evo.attr("data-uid");
			let memberUtype = evo.attr("data-utype");
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