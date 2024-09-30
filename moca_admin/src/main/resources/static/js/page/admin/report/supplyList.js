const supplyList = (function() {
	
	function init(){ 
		_evInit();
		_setDatepicker();
		_list.member.getList();
	}
	
	function _evInit(){
		let evo = $("[data-src='list'][data-act]").off();
		$(evo).on("click", function(ev){
			_action(ev);
		});
	}
	
	function _action(ev){
		let evo = $(ev.currentTarget);
		
		let type_v = ev.type;
		
		let act_v = evo.attr("data-act");
		
		let event = _event;
		
		if(type_v == "click") {
			if(act_v == "clickSearch") {
				_list.report.getList();
			} else if(act_v == "clickExcelDownload") {
				event.clickExcelDownload();
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
		clickExcelDownload: () => {
			let data = _list.report.getSearchData();
			util.blobFileDownload("/report/excel/bySupply", data, () => {
				console.log("done");
			});
		}
	}
	
	let _list = {
		// 매체사 
		member: {
			// 목록 조회 
			getList: () => {
				let url_v = "/member/list";
				
				let data_v = {
					utype: "S",
					status: "A",
					limit: null,
				};
				
				comm.send(url_v, data_v, "POST", function(resp) {
					let option = {
						element: $("#memberList"),
						dataList: resp.list,
						isAllOption: true,
						textAllOption: "전체 매체",
						valueKey: "member_id",
						textKey: "company_name",
					};
					multiSelectPicker.init(option);
				});
			},
			
			// 목록 그리기
			drawList: (list) => {
				let list_o = $("#memberList").html("");
				for(let item of list) {
					if(list_o.html() == "") {
						list_o.append("<option value='0'>전체 매체</option>");
					}
					
					let option_o = $("<option>").attr("value", item.member_id).html(item.company_name);
					list_o.append(option_o);
				}
				list_o.selectpicker();
				
				list_o.off("changed.bs.select");
				list_o.on("changed.bs.select", function(e, index, isSelected) {
					let option = list_o.find("option:eq(" + index + ")");
					let value = $(option).attr("value");
					
					let values = [];
					if(isSelected) {
						list_o.find("option").each(function(idx, opt_o){
							values.push(opt_o.value);
						});
					}
					
					if(value === "0") {
						list_o.val(values);
						list_o.selectpicker("refresh");
					} else {
						values = list_o.selectpicker("val");
						values = values.filter(val => {
							return val !== "0";
						});
						
						if(list_o.find("option").length -1 === values.length) {
							values.push("0");
						}
						
						list_o.val(values);
						list_o.selectpicker("refresh");
					}
				});
			}
		},
		
		report: {
			totalCount: 0,
			
			validateData: () => {
				let data = _list.report.getSearchData();
				
				if(!data.start_date) {
					return false;
				}
				
				if(!data.end_date) {
					return false;
				}
				
				if(!data.start_hour) {
					return false;
				}
				
				if(!data.end_hour) {
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
				
				let memberList = $("#memberList").selectpicker("val");
				if(memberList && memberList.length > 0 ){
					memberList = memberList.map(member => {
						return parseInt(member);
					});
				} 
				
				let data = {
					start_date: startDate_v,
					end_date: endDate_v,
					start_hour: startHour_v,
					end_hour: endHour_v,
					member_list: memberList,
				}
				
				return data;
			},
			
			// 리포트 데이터 조회
			getList: () => {
				
				let url_v = "/report/list/bySupply";
				let data_v = _list.report.getSearchData();
				
				if(_list.report.validateData()) {
					let startDate = data_v.start_date;
					let endDate = data_v.end_date;
					let startHour = data_v.start_hour;
					let endHour = data_v.end_hour;
					
					if(util.getDiffDate(startDate, endDate, "months") >= 3) {
						customModal.alert({
							content: "최대 조회 기간은 3개월입니다.",
						});
						return;
					}
					
					if(moment(startDate + " " + startHour).isAfter(endDate + " " + endHour)) {
						customModal.alert({
							content: "시작일이 종료일 이후일 수 없습니다.",
						});
						return;
					}
					
					_setSerachDateDiv(data_v);
					
					comm.send(url_v, data_v, "POST", function(resp){
						$("#btnExcelDown").show();
						
						let listData = resp.list;
						_list.report.totalCount = resp.tot_cnt;
						_list.report.drawChartTable(listData);
//						_chart.drawChart(listData);
						_list.report.drawTable(listData);
					});
				}
			},
			
			// 차트 테이블 그리기 
			drawChartTable: (list) => {
				let list_o = $("#chartTableList").html("");
				for(let i=0; i<list.length;i ++) {
					let item = list[i];
					
					let section_o = $("<section>").addClass("bar-graph bar-graph-horizontal notMedia-cate");
					list_o.append(section_o);
					
					{
						// 매체명
						let media_o = $("<div>").addClass("media").html("<p>" + item.company_name + "</p>");
						section_o.append(media_o);
					}
					{
						let categoryList = item.category_list;
						if(categoryList.length > 0) {
							for(let categoryItem of categoryList){
								let wrap_o = $("<div>").addClass("m_cate_wrap");
								section_o.append(wrap_o);
								
								let productList = categoryItem.product_list;
								if(productList.length > 0) {
									{
										// 구분 
										let mediaCate_o = $("<div>").addClass("media_cate").html(categoryItem.category_name);
										wrap_o.append(mediaCate_o);
									}
									{
										// bar
										let allBarWrap_o = $("<div>").addClass("all_bar_wrap");
										wrap_o.append(allBarWrap_o);
										
										
										for(let productItem of productList) {
											let barWrap_o = $("<div>").addClass("bar_wrap");
											allBarWrap_o.append(barWrap_o);
											
											let product_o = $("<span>").addClass("product").html(productItem.product_name);
											barWrap_o.append(product_o);
											
											let cnt = productItem.cnt;
											
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
								}
								
							}
						} else {
							let wrap_o = $("<div>").addClass("m_cate_not").html("광고가 없습니다.");
							section_o.append(wrap_o);
						}
						
					}
					
					/*
					let div_o = $("<div>").addClass("chartMed");
					list_o.append(div_o);
					
					let card_o = $("<div>").addClass("card");
					div_o.append(card_o);
					
					let category_o = $("<ul>").addClass("card-category");
					category_o.append("<li>매체</li>");
					category_o.append("<li>구분</li>");
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
					
					let categoryList = item.category_list;
					for(let categoryItem of categoryList){
						let cateLi_o = $("<li>").html(categoryItem.category_name);
						cateUl_o.append(cateLi_o);
					}
					*/
				}
			},
			
			// 테이블 그리기 
			drawTable: (list) => {
				let total = 0;
				let list_o = $("#listBody").html("");
				let total_o = $("#listBodyTotal").html("");
				
				for(let i=0; i<list.length; i++) {
					let item = list[i];
					let tr_o = $("<tr>");
					list_o.append(tr_o);
					
					let th1_o = $("<th>").html(item.company_name).attr("rowspan", item.rowspan);
					tr_o.append(th1_o);
					
					let categoryList = item.category_list;
					if(categoryList.length > 0) {
						for(let j=0; j<categoryList.length; j++) {
							let categoryItem = categoryList[j];
							if(j > 0) {
								tr_o = $("<tr>");
								list_o.append(tr_o);
							}
							let th2_o = $("<th>").html(categoryItem.category_name).attr("rowspan", categoryItem.rowspan);
							tr_o.append(th2_o);
							
							let productList = categoryItem.product_list;
							if(productList.length > 0) {
								for(let k=0; k<productList.length; k++) {
									let productItem = productList[k];
									if( k > 0 ){
										tr_o = $("<tr>");
										list_o.append(tr_o);
									} 
									{
										let td_o = $("<td>").html(productItem.product_name);
										tr_o.append(td_o);
									}
									{
										let td_o = $("<td>").html(util.numberWithComma(productItem.cnt));
										tr_o.append(td_o);
									}
									
									total += productItem.cnt;
								}
							} else {
								tr_o.append($("<td>").html("-"));
								tr_o.append($("<td>").html("-"));
							}
						}
					} else {
						tr_o.append($("<th>").html("-"));
						tr_o.append($("<td>").html("-"));
						tr_o.append($("<td>").html("-"));
					}
				}
				
				total_o.html(util.numberWithComma(total));
			}
		}
	};
	
	
	let _chart = {
		// 차트 그리기
		drawChart: (memberList) => {
			for(let item of memberList) {
				let memberId = item.member_id;
				let element_o = $("canvas[data-id='"+memberId+"']");
				let chartData = _chart.setChartData(item);
				_chart.setChart(element_o, chartData);
			}
		},
		
		// 차트 데이터 설정
		setChartData: (data) => {
			let labels = [];
			let datas = [];
			
			let categoryList = data.category_list;
			for(let categoryItem of categoryList) {
				let productList = categoryItem.product_list;
				for(let productItem of productList) {
					labels.push(productItem.product_name);
					datas.push(productItem.cnt);
				}
			}
			
			return {
				label: "노출수",
				labels,
				datas,
			};
		},
		
		// 차트 설정
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
	}
})();