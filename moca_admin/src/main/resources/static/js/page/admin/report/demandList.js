const demandList = (() => {
	
	// 해당 페이지 초기화 함수
	function init() {
		_evInit();
		_setDatepicker();
		_list.member.getList();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='list'][data-act]").off();
		evo.on("click keyup", function(ev){
			_action(ev);
		});
	}
	
	// 이벤트 분기 함수
	function _action(ev) {
		let evo = $(ev.currentTarget);
		
		let act_v = evo.attr("data-act");
		
		let type_v = ev.type;
		
		let event = _event;
		
		if(type_v == "click") {
			if(act_v == "clickPopOpen") {
				event.clickPopOpen();
			} else if(act_v == "clickPopMember") {
				event.clickPopMember(evo);
			} else if(act_v == "clickPopMemberRemove") {
				event.clickPopMemberRemove(evo);
			} else if(act_v == "clickPopSearch") {
				_list.member.getList();
			} else if(act_v == "clickPopAdjust") {
				event.clickPopAdjust();
			} else if(act_v == "clickSearch") {
				event.clickSearch();
			} else if(act_v == "clickExcelDownload") {
				event.clickExcelDownload();
			}
		} else if(type_v == "keyup") {
			if(act_v == "inputPopSearch") {
				if(ev.keyCode === 13) {
					_list.member.getList();
				}
			}
		}
	}
	
	// datepicker 설정
	function _setDatepicker() {
		let startDt_o = customDatePicker.init("searchStartDate");
		startDt_o.datepicker("setDate", moment().format("YYYY-MM-DD"));
		let endDt_o = customDatePicker.init("searchEndDate");
		endDt_o.datepicker("setDate", moment().format("YYYY-MM-DD"));
	}
	
	// 조회 기간 설정 
	function _setSerachDateDiv(data) {
		$("#searchDateDiv").html("<span>조회 기간</span> : " + data.start_date + "&nbsp;" + data.start_hour + ":00" + "&nbsp;~&nbsp;" + data.end_date + "&nbsp;" + data.end_hour + ":00");
	}
	
	let _event = {
		clickPopOpen: () => {
			$("#popSearchValue").val("");
			
			if(_list.member.adjustList == null) {
				_list.member.selectedList = null; 
			} else {
				_list.member.selectedList = _list.member.adjustList.slice();
			}
			
			_list.member.drawSelectedList();
			_list.member.getList();
			
			$("#demandMemberPop").modal("show");
		},
		
		// 팝업 사용자 선택
		clickPopMember: (evo) => {
			let parents_o = $(evo).parents("tr");
			let memberId = parents_o.attr("data-id");
			
			let memberData = _list.member.listData.find(item => {
				return item.member_id === parseInt(memberId);
			})
			
			if(memberData) {
				if(_list.member.selectedList == null) {
					_list.member.selectedList = [];
				}
				
				let selectedMemberData = _list.member.selectedList.find(item => {
					return item.member_id === parseInt(memberData.member_id);
				});
				
				if(selectedMemberData == null) {
					_list.member.selectedList.push(memberData);
					_list.member.drawSelectedList();
				}
			}
		},
		
		// 팝업 사용자 삭제
		clickPopMemberRemove: (evo) => {
			
			let memberId = $(evo).attr("data-id");
			
			_list.member.selectedList = _list.member.selectedList.filter((item) => {
				return item.member_id !== parseInt(memberId)
			});
			
			_list.member.drawSelectedList();
		},
		
		// 팝업 광고주 반영 버튼 클릭
		clickPopAdjust: () => {
			if(_list.member.selectedList != null && _list.member.selectedList.length > 0) {
				_list.member.adjustList = _list.member.selectedList.slice();
				
				let names = [];
				for(let item of _list.member.adjustList) {
					names.push(item.company_name);
				}
				
				$("#selectedMemberList").html(names.join(", "));
				$("#demandMemberPop").modal("hide");
			}
		},
		
		// 리포트 조회
		clickSearch: () => {
			if(_list.member.selectedList) {
				_list.report.getList();
			}
		},
		
		// 엑셀 다운로드
		clickExcelDownload: () => {
			let data = _list.report.getSearchData();
			util.blobFileDownload("/report/excel/byDemand", data, () => {
				console.log("done");
			});
		},
	}
	
	let _list = {
		member: {
			// 선택한 광고주 목록
			selectedList: null,
			
			// 반영된 광고주 목록
			adjustList: null,
			
			listData: null,
			
			getList: () => {
				let url_v = "/member/demand/list";
				
				let data_v = {
					status: "A",
					limit: null,
				};
				
				let searchValue_v = $("#popSearchValue").val();
				if(searchValue_v) {
					data_v.search_name = searchValue_v;
				}
				
				comm.send(url_v, data_v, "POST", function(resp) {
					_list.member.listData = resp.list;
					_list.member.drawList();
					_evInit();
				});
			},
			
			drawList: () => {
				let list = _list.member.listData;
				let list_o = $("#popListBody").html("");
				
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-id": item.member_id,
						"data-name": item.company_name
					});
					list_o.append(tr_o);
					
					{
						// 대행사
						let td_o = $("<td>").html(item.agency_company_name || "-");
						tr_o.append(td_o);
					}
					{
						// 광고주
						let td_o = $("<td>").html(item.company_name);
						tr_o.append(td_o);
					}
					{
						// 버튼
						let a_o = $("<a>").html("선택").attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickPopMember",
						});
						let td_o = $("<td>").append(a_o);
						tr_o.append(td_o);
					}
				}
			},
			
			// 선택된 멤버들 그리기
			drawSelectedList: () => {
				let list_o = $("#popSelectedList").html("");
				
				let list = _list.member.selectedList;
				if(list) {
					for(let item of list) {
						let li_o = $("<li>").html("<span>"+item.company_name+"</span> &nbsp;<i class='cusDelete' data-src='list' data-act='clickPopMemberRemove' data-id='"+item.member_id+"'></i>");
						list_o.append(li_o);
					}
				}
				
				_evInit();
			}
		},
		
		report: {
			totalCount: 0,
			
			validSearchData: () => {
				let data = _list.report.getSearchData();
				
				let startDate = data.start_date;
				let endDate = data.end_date;
				let startHour = data.start_hour;
				let endHour = data.end_hour;
				
				if(util.getDiffDate(startDate, endDate, "months") >= 3) {
					customModal.alert({
						content: "최대 조회 기간은 3개월입니다.",
					});
					return false;
				}
				
				if(moment(startDate + " " + startHour).isAfter(endDate + " " + endHour)) {
					customModal.alert({
						content: "시작일이 종료일 이후일 수 없습니다.",
					});
				
					return false;
				}
				
				if(!data.start_date) {
					return false;
				}
				
				if(!data.start_hour) {
					return false;
				}
				
				if(!data.end_date) {
					return false;
				}
				
				if(!data.end_hour) {
					return false;
				}
				
				if(data.member_list == null) {
					return false;
				}
				
				if(data.member_list.length == 0) {
					return false;
				}
				
				return true;
			},
			
			getSearchData: () => {
				let startDate_v = $("#searchStartDate").val();
				let startHour_o = $("#searchStartHour :selected");
				let startHour_v = startHour_o.val();
				let endDate_v = $("#searchEndDate").val();
				let endHour_o = $("#searchEndHour :selected");
				let endHour_v = endHour_o.val();
				
				let memberList = _list.member.adjustList.map(item => {
					return item.member_id;
				});
				
				return {
					start_date: startDate_v,
					end_date: endDate_v,
					start_hour: startHour_v,
					end_hour: endHour_v,
					member_list: memberList,
				}
			},
			
			getList: () => {
				if(_list.report.validSearchData()) {
					let url_v = "/report/list/byDemand";
					let data_v = _list.report.getSearchData();
					
					_setSerachDateDiv(data_v);
					
					comm.send(url_v, data_v, "POST", function(resp){
						$("#btnExcelDown").show();
						let listData = resp.list;
						_list.report.totalCount = resp.tot_cnt;
						_list.report.drawChartTable(listData);
//					_chart.drawChart(listData);
						_list.report.drawTable(listData);
					});
				}
				
			},
			
			drawChartTable: (listData) => {
				let list = [];
				for(let item of listData) {
					list = list.concat(item.demand_list);
				}
				let list_o = $("#chartTableList").html("");
				for(let i=0; i<list.length;i ++) {
					let item = list[i];
					
					let section_o = $("<section>").addClass("bar-graph bar-graph-horizontal notMedia-cate");
					list_o.append(section_o);
					
					{
						// 광고주명
						let media_o = $("<div>").addClass("media").html("<p>" + item.company_name + "</p>");
						section_o.append(media_o);
					}
					let wrap_o = $("<div>");
					section_o.append(wrap_o);
					
					let sgList = item.sg_list;
					if(sgList.length > 0){
						wrap_o.addClass("m_cate_wrap");
						{
							let allBarWrap_o = $("<div>").addClass("all_bar_wrap");
							wrap_o.append(allBarWrap_o);
							
							for(let sgItem of sgList) {
								let barWrap_o = $("<div>").addClass("bar_wrap");
								allBarWrap_o.append(barWrap_o);
								
								let product_o = $("<span>").addClass("product").html(sgItem.sg_name);
								barWrap_o.append(product_o);
								
								let cnt = sgItem.cnt;
								
								let figure_o = $("<span>").addClass("figure").html(util.numberWithComma(cnt));
								barWrap_o.append(figure_o);
								
								let div_o = $("<div>");
								barWrap_o.append(div_o);
								
								let bar_o = $("<div>");
								if(cnt === 0) {
									bar_o.addClass("not-bar");
								} else {
									bar_o.addClass("bar").css("width", Math.ceil((cnt / _list.report.totalCount) * 100) + "%");
								}
								div_o.append(bar_o);
							}
						}
					} else {
						wrap_o.addClass("m_cate_not").html("광고가 없습니다.");
					}
					/*
					let div_o = $("<div>").addClass("chartMed");
					list_o.append(div_o);
					
					let card_o = $("<div>").addClass("card");
					div_o.append(card_o);
					
					let category_o = $("<ul>").addClass("card-category ag");
					category_o.append("<li>광고주</li>");
					category_o.append("<li>상품</li>");
					category_o.append("<li>노출량</li>");
					card_o.append(category_o);
					
					let header_o = $("<div>").addClass("card-header");
					card_o.append(header_o);
					
					let ul_o = $("<ul>");
					header_o.append(ul_o);
					
					let li_o = $("<li>");
					ul_o.append(li_o);
					li_o.append("<p>" + item.company_name);
					
					let cateUl_o = $("<ul>");
					li_o.append(cateUl_o);
					
					let body_o = $("<div>").addClass("card-body");
					card_o.append(body_o);
					
					let canvas_o = $("<canvas>").addClass("chart-line").attr({
						"data-id": item.member_id
					});
					body_o.append(canvas_o);
					*/
				}
			},
			
			drawTable: (list) => {
				let total = 0;
				let list_o = $("#listBody").html("");
				let total_o = $("#listBodyTotal").html("");
				
				for(let i=0; i<list.length; i++) {
					let item = list[i];
					let tr_o = $("<tr>");
					list_o.append(tr_o);
					
					
					// 대행사
					{
						let th1_o = $("<th>").html(item.company_name).attr({
							"data-agency_id": item.member_id,
							"rowspan": item.rowspan
						});
						tr_o.append(th1_o);
					}
					
					let demandList = item.demand_list;
					for(let j=0; j<demandList.length; j++) {
						let demandItem = demandList[j];
						
						if(j > 0) {
							tr_o = $("<tr>");
							list_o.append(tr_o);
						}
						
						// 광고주 
						{
							let th_o = $("<th>").html(demandItem.company_name).attr("rowspan", demandItem.rowspan);
							tr_o.append(th_o);
						}
						
						let sgList = demandItem.sg_list;
						if(sgList && sgList.length > 0) {
							for(let k=0; k<sgList.length; k++) {
								let sgItem = sgList[k];
								
								if( k > 0 ){
									tr_o = $("<tr>");
									list_o.append(tr_o);
								} 
								
								// 광고명
								{
									let td_o = $("<td>").html(sgItem.sg_name);
									tr_o.append(td_o);
								}
								
								// 노출량
								{
									let td_o = $("<td>").html(util.numberWithComma(sgItem.cnt));
									tr_o.append(td_o);
								}
							}
						} else {
							tr_o.append($("<td>").html("-"));
							tr_o.append($("<td>").html("-"));
						}
					}
				}
				
				total_o.html(util.numberWithComma(_list.report.totalCount));
			},
		}
	};
	
	let _chart = {
		drawChart: (list) => {
			let demandList = [];
			for(let item of list) {
				demandList = demandList.concat(item.demand_list);
			}
			
			for(let item of demandList) {
				let memberId = item.member_id;
				let element_o = $("canvas[data-id='"+memberId+"']");
				let chartData = _chart.setChartData(item);
				_chart.setChart(element_o, chartData);
			}
		},
		
		setChartData: (data) => {
			let labels = [];
			let datas = [];
			
			let sgList = data.sg_list;
			for(let sgItem of sgList) {
				labels.push(sgItem.sg_name);
				datas.push(sgItem.cnt);
			}
			
			return {
				label: "노출수",
				labels,
				datas,
			};
		},
		
		setChart: (element, chartData) => {
			/*매체별 리포트 차트 그래프 통일 옵션값*/
	        const horizontalBarOpt = {
	         legend: {
	            display: false,
	            labels: {
	               fontColor: '#404040',
	               fontFamily: 'INNODAOOM-LIGHT',
	               padding: 40,
	            },
	         },
	         title: {
	            display: false,
	            //text: ' '
	         },
	         scales: {
	            xAxes: [{
	               ticks: {
	                  beginAtZero: false,
	                  steps: 7,
	                  stepValue: 500,
	                  max: 3500,
	               },
	            }],
	            yAxes: [{
	               afterFit: function (scaleInstance) {
	                  scaleInstance.width = 140; // sets the width to 100px
	               },
	        
	            }, ],
	         },
	         responsive: true,
	         maintainAspectRatio: false,
	         //maintainAspectRatio: true,
	        };
	        
			let chart = new Chart($(element), {
				type: "horizontalBar",
				data: {
					labels: chartData.labels, 
					datasets: [{
						data: chartData.datas, 
						label: chartData.label,  
						barThickness: 'flex',
						barPercentage: 1.0,
						categoryPercentage: 0.2,
						borderColor: "#619eff",
						backgroundColor: '#619eff',
						fill: false
					}],
				},
				options: horizontalBarOpt,
			});
		}
	}
	
	return {
		init,
		_list,
	}
})();