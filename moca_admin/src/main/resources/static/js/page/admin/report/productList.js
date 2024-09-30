const productList = (() => {
	
	// 해당 페이지 초기화 함수
	function init() {
		_evInit();
		_setDatepicker();
		_list.product.getList();
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
			} else if(act_v == "clickPopProduct") {
				event.clickPopProduct(evo);
			} else if(act_v == "clickPopRemoveProduct") {
				event.clickPopRemoveProduct(evo);
			} else if(act_v == "clickPopSearch") {
				_list.product.getList();
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
					_list.product.getList();
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
		// 상품 선택 팝업 오픈
		clickPopOpen: () => {
			$("#popSearchValue").val("");
			
			if(_list.product.adjustList == null) {
				_list.product.selectedList = null; 
			} else {
				_list.product.selectedList = _list.product.adjustList.slice();
			}
			
			_list.product.drawSelectedList();
			_list.product.getList();
			
			$("#productPop").modal("show");
		},
		
		// 팝업 상품 선택
		clickPopProduct: (evo) => {
			let parents_o = $(evo).parents("tr");
			let productId = parents_o.attr("data-id");
			
			let productData = _list.product.listData.find(item => {
				return item.product_id === parseInt(productId);
			})
			
			if(productData) {
				if(_list.product.selectedList == null) {
					_list.product.selectedList = [];
				}
				
				let selectedProductData = _list.product.selectedList.find(item => {
					return item.product_id === parseInt(productData.product_id);
				});
				
				if(selectedProductData == null) {
					_list.product.selectedList.push(productData);
					_list.product.drawSelectedList();
				}
			}
		},
		
		// 팝업 상품 삭제
		clickPopRemoveProduct: (evo) => {
			let productId = $(evo).attr("data-id");
			
			_list.product.selectedList = _list.product.selectedList.filter((item) => {
				return item.product_id !== parseInt(productId);
			});
			
			_list.product.drawSelectedList();
		},
		
		// 팝업 광고주 반영 버튼 클릭
		clickPopAdjust: () => {
			if(_list.product.selectedList != null && _list.product.selectedList.length > 0) {
				_list.product.adjustList = _list.product.selectedList.slice();
				
				let names = [];
				for(let item of _list.product.adjustList) {
					names.push(item.product_name);
				}
				
				$("#selectedProductList").html(names.join(", "));
				$("#productPop").modal("hide");
			}
		},
		
		// 리포트 조회
		clickSearch: () => {
			if(_list.product.selectedList) {
				_list.report.getList();
			}
		},

		// 엑셀 다운로드
		clickExcelDownload: () => {
			let data = _list.report.getSearchData();
			util.blobFileDownload("/report/excel/byProduct", data, () => {
				console.log("done");
			});
		},
	}
	
	let _list = {
		product: {
			// 선택한 상품 목록
			selectedList: null,
			
			// 반영된 상품 목록
			adjustList: null,
			
			listData: null,
			
			getList: () => {
				let url_v = "/report/product/list";
				
				let data_v = {
				};
				
				let searchValue_v = $("#popSearchValue").val();
				if(searchValue_v) {
					data_v.search_value = searchValue_v;
				}
				
				comm.send(url_v, data_v, "POST", function(resp) {
					_list.product.listData = resp.list;
					_list.product.drawList();
					_list.product.drawSelectedList();
					_evInit();
				});
			},
			
			drawList: () => {
				let list = _list.product.listData;
				let list_o = $("#popListBody").html("");
				
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-id": item.product_id,
						"data-name": item.product_name
					});
					list_o.append(tr_o);
					
					{
						// 매체사
						let td_o = $("<td>").html(item.company_name);
						tr_o.append(td_o);
					}
					{
						// 분류
						let td_o = $("<td>").html(item.category_name);
						tr_o.append(td_o);
					}
					{
						// 상품명
						let td_o = $("<td>").html(item.product_name);
						tr_o.append(td_o);
					}
					{
						// 선택
						let a_o = $("<a>").html("선택").attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickPopProduct",
						});
						let td_o = $("<td>").append(a_o);
						tr_o.append(td_o);
					}
				}
			},
			
			// 선택된 상품들 그리기
			drawSelectedList: () => {
				let list_o = $("#popSelectedList").html("");
				
				let list = _list.product.selectedList;
				if(list) {
					for(let item of list) {
						let li_o = $("<li>").html("<span>"+item.product_name+"</span> &nbsp;<i class='cusDelete' data-src='list' data-act='clickPopRemoveProduct' data-id='"+item.product_id+"'></i>");
						list_o.append(li_o);
					}
				}
				
				_evInit();
			}
		},
		
		report: {
			
			totalCount: 0,
			
			// 유효한 검색 데이터인지 확인
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
				
				if(data.product_list == null) {
					return false;
				}
				
				if(data.product_list.length == 0) {
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
				
				let productList = _list.product.adjustList.map(item => {
					return item.product_id;
				});
				
				return {
					start_date: startDate_v,
					end_date: endDate_v,
					start_hour: startHour_v,
					end_hour: endHour_v,
					product_list: productList
				};
			},
			
			getList: () => {
				if(_list.report.validSearchData()) {
					let url_v = "/report/list/byProduct";
					let data_v = _list.report.getSearchData();
					
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
			
			drawChartTable: (list) => {
				let list_o = $("#chartTableList").html("");
				for(let i=0; i<list.length;i ++) {
					let item = list[i];
					
					let section_o = $("<section>").addClass("bar-graph bar-graph-horizontal");
					list_o.append(section_o);
					
					{
						// 매체명
						let media_o = $("<div>").addClass("media").html("<p>" + item.company_name + "</p>");
						section_o.append(media_o);
					}
					{
						let productList = item.product_list;
						for(let productItem of productList){
							let wrap_o = $("<div>").addClass("m_cate_wrap");
							section_o.append(wrap_o);
							
							{
								// 상품명
								let mediaCate_o = $("<div>").addClass("media_cate").html(productItem.product_name);
								wrap_o.append(mediaCate_o);
							}
							{
								// bar
								let allBarWrap_o = $("<div>").addClass("all_bar_wrap");
								wrap_o.append(allBarWrap_o);
								
								let deviceList = productItem.device_list;
								if(deviceList.length > 0) {
									if(deviceList) {
										for(let deviceItem of deviceList) {
											let barWrap_o = $("<div>").addClass("bar_wrap");
											allBarWrap_o.append(barWrap_o);
											
											let product_o = $("<span>").addClass("product").html(deviceItem.serial_number);
											barWrap_o.append(product_o);
											
											let cnt = deviceItem.cnt;
											
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
						} 
						
					}
					
					/*
					let div_o = $("<div>").addClass("chartMed chartMocafe chM1");
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
					li_o.append("<p>" + item.ssp_company_name);
					
					let cateUl_o = $("<ul>");
					li_o.append(cateUl_o);
					
					cateUl_o.append($("<li>").html(item.category_name));
					
					let body_o = $("<div>").addClass("card-body");
					card_o.append(body_o);
					
					let canvas_o = $("<canvas>").addClass("chart-line").attr({
						"data-id": item.product_id
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
					
					
					// 매체사
					{
						let th1_o = $("<th>").html(item.company_name).attr({
							"data-ssp_member_id": item.member_id,
							"rowspan": item.rowspan,
						});
						tr_o.append(th1_o);
					}
					
					// 상품명
					let productList = item.product_list;
					if(productList && productList.length > 0) {
						for(let j=0; j<productList.length; j++) {
							let productItem = productList[j];
							
							if(j > 0) {
								tr_o = $("<tr>");
								list_o.append(tr_o);
							}
							
							{
								let th2_o = $("<th>").html(productItem.product_name).attr("rowspan", productItem.rowspan);
								tr_o.append(th2_o);
							}
							
							// 디바이스명
							let deviceList = productItem.device_list;
							if(deviceList && deviceList.length > 0) {
								for(let k=0; k<deviceList.length; k++) {
									let deviceItem = deviceList[k];
									
									if(k > 0) {
										tr_o = $("<tr>");
										list_o.append(tr_o);
									}
									
									{
										// 디바이스명
										let td_o = $("<td>").html(deviceItem.serial_number);
										tr_o.append(td_o);
									}
									
									{
										// 노출량
										let td_o = $("<td>").html(util.numberWithComma(deviceItem.cnt));
										tr_o.append(td_o);
									}
									
									total += deviceItem.cnt;
								}
							} else {
								tr_o.append($("<td>").html("-"));
								tr_o.append($("<td>").html("-"));
							}
						}
					}
				}
				
				total_o.html(util.numberWithComma(total));
			},
		}
	};
	
	let _chart = {
		drawChart: (list) => {
			for(let item of list) {
				let productId = item.product_id;
				let element_o = $("canvas[data-id='"+productId+"']");
				let chartData = _chart.setChartData(item);
				_chart.setChart(element_o, chartData);
			}
		},
		
		setChartData: (data) => {
			let labels = [];
			let datas = [];
			
			let deviceList = data.device_list;
			for(let item of deviceList) {
				labels.push(item.serial_number);
				datas.push(item.cnt);
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