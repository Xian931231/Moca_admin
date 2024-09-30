const campaignSgList = (function () {
	
	// 해당 페이지 초기화 함수
	function init(){
		_list.getList();
		_evInit();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='list'][data-act]").off();
		evo.on("click change keyup", function(ev){
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
			if(act_v == "clickSearch") { // 검색 클릭
				_list.getList();
			} else if(act_v == "clickSgStopBtn") { // 진행중 클릭 > 긴급종료
				event.clickSgStopBtn(evo);
			} else if(act_v == "clickSgStop") { // 긴급종료
				event.clickSgStop();				
			} else if(act_v == "clickId") { // 광고주, 대행사 로그인
				event.clickId(evo);				
			} 
		} else if(type_v == "change") {
			if(act_v == "changeSgStatus") {
				_list.getList();
			}
		} else if(type_v == "keyup") {
			if(act_v == "searchInput") {
				if(ev.keyCode == 13) {
					_list.getList();
				}
			}
		}
	}
	
	// 이벤트 담당
	let _event = {
		// 진행중 클릭
		clickSgStopBtn: function(evo) {
			customModal.confirm({
				content: "광고 긴급종료 실행 시 진행상태가 종료로 바뀌고<br/>노출이 중단됩니다. 계속 하시겠습니까?",
				confirmCallback: function() {
					let tr_o = evo.parents("tr");
					let sgId = tr_o.attr("data-sg-id");
					
					$("#sgStopPasswd").val("");
					$("#sgStopReason").attr({"data-sg-id": sgId}).val("");
					$("#sgStopReasonModal").modal("show");
				}
			});
		},
		
		// 긴급종료
		clickSgStop: function() {
			let url_v = "/sg/stop";
			
			let data_v = {
				"passwd": $("#sgStopPasswd").val(),
				"sg_id": $("#sgStopReason").attr("data-sg-id"),
				"stop_reason": $("#sgStopReason").val()
			}
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					if(resp.code) {
						if(resp.code == 2212) {
							customModal.alert({
								content: "비밀번호를 다시 확인하고 입력해주세요."
							});
						} else if(resp.code == 6000) {
							customModal.alert({
								content: "이미 긴급 종료된 광고입니다."
							});
						} else if(resp.code == 6005) {
							customModal.alert({
								content: "사유를 입력해주세요."
							});
						}	
						return;
					}
					
					$("#sgStopReasonModal").modal("hide");
					_list.getList();
				}
			});
		},
		
		// 광고주, 대행사 로그인
		clickId: function(evo) {
			// 캠페인, 광고 id
			let memberId = evo.attr("data-member-id");
			let memberUid = evo.attr("data-member-uid");
			let memberUtype = evo.attr("data-member-utype");
			
			let callbackUrl = "/";
			let campaignId = evo.attr("data-campaign-id");
			let sgId = evo.attr("data-sg-id");
			
			if(!util.valNullChk(campaignId)) {
				callbackUrl = "/demand/campaign/sg/list?id=" + campaignId;
			} else if(!util.valNullChk(sgId)) {
				callbackUrl = "/demand/campaign/sg/detail?id=" + sgId;
			} 
			
			util.staffLogin({
				memberId,
				memberUid,
				memberUtype,
				callbackUrl,
			});
		}
	}
	
	// 리스트
	let _list = {
		getList: function(curPage = 1) {
			let url_v = "/sg/withDemand/list";
	
			let data_v = {
				"search_yn": "N"
			};
			
			$("#sgStatus").selectpicker("refresh");
			$("#searchType").selectpicker("refresh");
			
			// 검색 조건
			let sgStatus_v = $("#sgStatus option:selected").val();
			if(!util.valNullChk(sgStatus_v) && sgStatus_v != "all") {
				data_v.search_status = sgStatus_v;
			} else {
				data_v.search_status = "";
			}
			
			let searchType_v = $("#searchType option:selected").val();
			if(!util.valNullChk(searchType_v)) {
				data_v.search_type = searchType_v;
			}
			
			let search_v = $("#searchInput").val();
			if(!util.valNullChk(search_v)) {
				data_v.search_value = search_v;
				data_v.search_yn = "Y";
			}
			
			let pageOption = {
				"limit": 10
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
				dev.log(resp);
				if(resp) {
					_list.drawList(resp.list);
					page_o.drawPage(resp.tot_cnt);
					_evInit();
				}
			});
		},
		
		drawList: function(list) {
			let tab_o = $("#demandList").empty();
			
			// 광고주 리스트
			if(list && list.length > 0) {
				for(let i = 0; i < list.length; i++) {
					let item = list[i];
					
					let button_o = $("<button>");
					tab_o.append(button_o);
					
					// 광고주 탭
					button_o.attr({
						"type": "button",
						"class": "btn btn-block mb-2 text-left accordion-btn",
						"data-toggle": "collapse",
						"data-target": "#target" + i,
					});
					
					
					// 광고주명, ID
					let span_demand_name_o = $("<span>").html(item.demand_company_name);
					let a_demand_o = $("<a>").attr({
						"href": "javascript:;",
						"data-src": "list",
						"data-act": "clickId",
						"data-member-id": item.member_id,
						"data-member-uid": item.demand_uid,
						"data-member-utype": globalConfig.memberType.DEMAND.utype,
					}).html(item.demand_uid);
					span_demand_name_o.append("(", a_demand_o, ")");
					
					// 대행사
					let span_agency_name_o = $("<span>").html("대행사 : ");
					let agencyName = "없음";
					if(!util.valNullChk(item.agency_member_id)) {
						agencyName = item.agency_company_name;
						let a_agency_o = $("<a>");
						a_agency_o.attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickId",
							"data-member-id": item.agency_member_id,
							"data-member-uid": item.agency_uid,
							"data-member-utype": globalConfig.memberType.AGENCY.utype,
						}).html(item.agency_uid);
						span_agency_name_o.append(agencyName);
						span_agency_name_o.append("(", a_agency_o, ")");
					} else {
						span_agency_name_o.append(agencyName);
					}
					span_agency_name_o.append(" | ");
					
					// 승인상태
					let searchStatus = $("#sgStatus option:selected").val();
					let statusText = "";
					if(searchStatus == "all" || searchStatus == 1) {
						statusText = "진행중";
					} else if(searchStatus == 2) {
						statusText = "일시중지";
					} else if(searchStatus == 0) {
						statusText = "승인대기";
					} else if(searchStatus == 9) {
						statusText = "승인거부";
					} else if(searchStatus == 7 || searchStatus == 8) {
						statusText = "종료";
					}
					let span_proceed_o = $("<span>").html(statusText + " " + item.proceed + " / 전체 " + item.total);
					
					let span_o = $("<span>");
					span_o.append(span_agency_name_o, span_proceed_o);
					
					button_o.append(span_demand_name_o, span_o);
					
	
					// 테이블
					let div_o = $("<div>").attr({
						"class": "collapse",
						"id": "target" + i,
						"data-parent": "#demandList",
					});
					let div_wrap_o = $("<div>").addClass("tableWrap mocafeCamp");
					let div_in_o = $("<div>").addClass("tableInner");
					div_wrap_o.append(div_in_o);
					div_o.append(div_wrap_o);
					tab_o.append(div_o);
					
					let table_o = $("<table>").addClass("table");
					div_in_o.append(table_o);
					
					let colgroup_o = $("<colgroup>");
					let col_1_o = $("<col>").attr({"width": "80px"});
					let col_2_o = $("<col>").attr({"width": "230px"});
					let col_3_o = $("<col>").attr({"width": "230px"});
					let col_4_o = $("<col>").attr({"width": "100px"});
					let col_5_o = $("<col>").attr({"width": "140px"});
					let col_6_o = $("<col>").attr({"width": "140px"});
					let col_7_o = $("<col>").attr({"width": "140px"});
					let col_8_o = $("<col>").attr({"width": "*"});
					colgroup_o.append(col_1_o, col_2_o, col_3_o, col_4_o, col_5_o, col_6_o, col_7_o, col_8_o);
					table_o.append(colgroup_o);
					
					let thead_o = $("<thead>");
					let tr_o = $("<tr>");
					let th_1_o = $("<th>").html("과금방식");
					let th_2_o = $("<th>").html("캠페인명");
					let th_3_o = $("<th>").html("광고명");
					let th_4_o = $("<th>").html("총 노출량");
					let th_5_o = $("<th>").html("총 집행금액");
					let th_6_o = $("<th>").html("광고 시작");
					let th_7_o = $("<th>").html("광고 종료");
					let th_8_o = $("<th>").html("진행 상태");
					tr_o.append(th_1_o, th_2_o, th_3_o, th_4_o, th_5_o, th_6_o, th_7_o, th_8_o);
					thead_o.append(tr_o);
					table_o.append(thead_o);
					
					let tbody_o = $("<tbody>");
					table_o.append(tbody_o);
					
					let campaignList = item.campaign_list;
	
					let impressions = 0;
					let price = 0;
					
					// 캠페인 리스트
					if(campaignList.length != 0) {
						for(let j = 0; j < campaignList.length; j++) {
							let campaign = campaignList[j];
							
							// 광고 리스트
							for(let k = 0; k < campaign.sg_list.length; k++) {
								let sg = campaign.sg_list[k];
								let tr_o = $("<tr>").attr({ // 상품 한 줄
									"data-campaign-id": sg.campaign_id,
									"data-sg-id": sg.id,
								}); 
								tbody_o.append(tr_o);
								
								if(k == 0) {
									{
										// 과금방식
										let td_o = $("<td>").attr({"rowspan": campaign.sg_list.length}).html(campaign.pay_type);
										tr_o.append(td_o);
									}
									{
										// 캠페인명
										let td_o = $("<td>").attr({"rowspan": campaign.sg_list.length});
										let a_o = $("<a>").attr({
											"href": "javascript:;",
											"data-src": "list",
											"data-act": "clickId",
											"data-member-id": item.member_id,
											"data-member-uid": item.demand_uid,
											"data-member-utype": globalConfig.memberType.DEMAND.utype,
											"data-campaign-id": campaign.campaign_id
										}).html(campaign.name);
										td_o.append(a_o);
										tr_o.append(td_o);
									}
								}
								{
									// 광고명
									let td_o = $("<td>");
									let a_o = $("<a>").attr({
										"href": "javascript:;",
										"data-src": "list",
										"data-act": "clickId",
										"data-member-id": item.member_id,
										"data-member-uid": item.demand_uid,
										"data-member-utype": globalConfig.memberType.DEMAND.utype,
										"data-sg-id": sg.id
									}).html(sg.name);
									td_o.append(a_o);
									tr_o.append(td_o);
								}
								{
									// 광고 노출수
									let td_o = $("<td>");
									if(sg.impressions) {
										td_o.html(util.numberWithComma(sg.impressions));
										impressions += sg.impressions;
									} else {
										td_o.html(0);
										impressions += 0;
									}
									tr_o.append(td_o);
								}
								{
									// 가격
									let td_o = $("<td>").html("\\" + util.numberWithComma(sg.price));
									price += sg.price;
									tr_o.append(td_o);
								}
								{
									// 광고 시작
									let td_o = $("<td>");
									if(campaign.pay_type == "CPP") {
										// CPP의 경우 광고 승인 후 시작, 종료일 노출
										if(sg.status != 0 && sg.status != 9) {
											td_o.html(sg.start_ymd);
										} else {
											td_o.html("-");
										}
									} else {
										// CPM의 경우 배치 돌려진 후 로그 시간
										if(!util.valNullChk(sg.display_start_date) && sg.status != 0 && sg.status != 9) {
											td_o.html(sg.display_start_date);
										} else {
											td_o.html("-");
										}
									}
									tr_o.append(td_o);
								}
								{
									// 광고 종료
									let td_o = $("<td>");
										if(sg.status == 7) { // 긴급종료일 경우 stop_date
											td_o.html(sg.stop_date);
										} else {
											if(campaign.pay_type == "CPP") {
												if(sg.status != 0 && sg.status != 9) {
													td_o.html(sg.end_ymd);
												} else {
													td_o.html("-");
												}
											} else {
												if(!util.valNullChk(sg.display_end_date) && sg.status != 0 && sg.status != 9) {
													td_o.html(sg.display_end_date);
												} else {
													td_o.html("-");
												}
											}
										}
									tr_o.append(td_o);
								}
								{
									// 진행상태
									let td_o = $("<td>");
									let sgStatus = sg.status;
									let p_o = $("<p>").addClass("stateBox");
									switch (sgStatus) {
										case 1 :
											p_o = $("<button>").attr({
												"type": "button",
												"class": "btn stateBox state-ongoing",
												"data-src": "list",
												"data-act": "clickSgStopBtn",
											}).html("진행중");
											break;
										case 0 : 
											p_o.addClass("state-delay").html("승인대기");
											break;
										case 2:
											p_o.addClass("state-delay").html("일시중지");
											break;
										case 7:
											p_o.addClass("state-end").html("종료");
											break;
										case 8:
											p_o.addClass("state-end").html("종료");
											break;
										case 9:
											p_o.addClass("state-end").html("승인거부");
											break;
									} 
									td_o.append(p_o);
									tr_o.append(td_o);
								}
							}
						}
					} else {
						let div_o = $("<div>").addClass("notnotnot").html("광고가 없습니다.");
						div_wrap_o.prepend(div_o);
	
						let tr_o = $("<tr>");
						for(let m = 0; m < 8; m++)  {
							let td_o = $("<td>");
							tr_o.append(td_o);
						}
						tbody_o.append(tr_o);
					}
				
					// 테이블 푸터
					let div_footer_o = $("<div>").addClass("tableFooterFix cpm1");
					let ul_footer_o = $("<ul>");
					for(let l = 0; l < 8; l++) {
						let li_o = $("<li>");
						if(campaignList.length != 0) {
							let total = 0;
							if(l == 3) {
								total = impressions;
								li_o.html(util.numberWithComma(total));
							} else if(l == 4) {
								total = price;
								li_o.html("\\" + util.numberWithComma(total));
							}
						}
						ul_footer_o.append(li_o);
					}
					div_footer_o.append(ul_footer_o);
					div_wrap_o.append(div_footer_o);	
				}
				$("#tableWrap").removeClass("blank");
				$("#demandList").removeClass("notnotnot");
				$("#page").show();
			} else {
				$("#tableWrap").addClass("blank");
				$("#demandList").addClass("notnotnot").html("검색 결과가 없습니다.");
				$("#page").hide();
			}
			_evInit();
		}
	}

	return {
		init,
	}
	
})();