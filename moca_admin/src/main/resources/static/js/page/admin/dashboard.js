const dashboard = (function() {
    
    // 해당 페이지 초기화 함수
    function init() {
		 _event.preventScroll();
		_map.init();
        $("#dashboardDate").text(moment().format("YYYY-MM-DD HH:mm"));
   		$("#mapDate").html(moment().format("YYYY-MM-DD HH:mm") + ' 기준<i class="dateReset" data-src="dashboard" data-act="clickResetMapDate"></i>');
		_drawStandardMonth(1);
		_drawStandardMonth(0, true);
		_drawStandardMonth(2);
        _card.getDetail();
        _graph.getExposureList();
        _graph.getPriceList();
    }

    // 이벤트 초기화 
    function _evInit() {
        let evo = $("[data-src='dashboard'][data-act]").off();
        evo.on("click change", function(ev) {
            _action(ev);
        });
    }
  
    // 이벤트 분기 함수
    function _action(ev) {
        let evo = $(ev.currentTarget);
        
        let act_v = evo.attr("data-act");

        let type_v = ev.type;

        let event = _event;

        if (type_v == "click") {
            if (act_v == "clickResetDate") {
                event.clickResetDate();
            } else if (act_v == "prevMonth") {
                event.slideMonth(evo);
            } else if (act_v == "nextMonth") {
                event.slideMonth(evo);
			} else if(act_v == "clickResetMapDate") {
				event.clickResetMapDate();
			} else if(act_v == "clickInfoList") {
				event.clickInfoList(evo);
			} else if(act_v == "clickInfoDetail") {
				event.clickInfoDetail(evo);
			} else if(act_v == "clickCard") {
				event.movePage(evo);
			}
        } else if (type_v == "change") {
            if (act_v == "changeSi") {
				event.changeSi(evo);
            } else if (act_v == "changeGu") {
				event.changeGu(evo);
			}
		}
    }
    
    // 대시보드 카드 관련 함수
    const _card = {
        getDetail: function() {
            let url_v = "/dashboard/detail";

            comm.send(url_v, null, "POST", function(resp) {
				if(resp.result) {
	                _card.drawDetail(resp.data);
				}
            });
        },

        drawDetail: function(data) {
            // 승인 대기 / 완료
            _drawText("request", data.sg_request_count, data.sg_proceed_count);

            // 입금 대기 / 완료
            _drawText("deposit", data.pay_wait_count, data.pay_complete_count);

            // 환불 대기 / 완료
            _drawText("refund", data.refund_wait_count, data.refund_complete_count);

            // 매체 승인
            _drawText("supply", data.supply_wait_count, data.supply_complete_count);

            // 정산임박 매체
            _drawText("balance", data.balance_wait_count, data.balance_complete_count);

            // 장비 오류 / 정상
            _drawText("device", data.device_error_count, data.device_run_count);
			
			// cpp 종료 예정
            $("#endCpp").text(util.numberWithComma(data.cpp_soon_count));
            // cpp 진행중
            $("#totalCpp").text(util.numberWithComma(data.cpp_proceed_count));
            
            // cpm 종료 예정
            $("#endCpm").text(util.numberWithComma(data.cpm_soon_count));
            // cpm 진행중
            $("#totalCpm").text(util.numberWithComma(data.cpm_proceed_count));

            // cpp 차트
            let cppProceed = parseInt(data.cpp_proceed_count) - parseInt(data.cpp_soon_count);
            let cppData = [cppProceed, data.cpp_soon_count];
            _drawDounhnutChart("chartCpp", cppData);

            // cpm 차트
            let cpmProceed = parseInt(data.cpm_proceed_count) - parseInt(data.cpm_soon_count);
            let cpmData = [cpmProceed, data.cpm_soon_count];
            _drawDounhnutChart("chartCpm", cpmData);
        }
    }
	
	// 그래프 관련 함수
    const _graph = {
		// 총 노출 수 데이터
        getExposureList: function() {
            let url_v = "/dashboard/exposure";

            let standardMonth = $("#standardMonth li.active");
            let year = standardMonth.attr("data-year");
            let month = standardMonth.attr("data-month");
            
            let data_v = {
                "year": year,
                "month": month,
            };
            comm.send(url_v, data_v, "POST", function(resp) {
                if (resp.result) {
                    _graph.drawExposureList(resp);
                }
            });
        },
		
		// 총 집행금액 데이터
        getPriceList: function() {
            let url_v = "/dashboard/price";

            let standardMonth = $("#standardMonth li.active");
            let year = standardMonth.attr("data-year");
            let month = standardMonth.attr("data-month");
            
            let data_v = {
                "year": year,
                "month": month,
            };

            comm.send(url_v, data_v, "POST", function(resp) {
                if (resp.result) {
                    _graph.drawPriceList(resp);
                }
            });
        },
        
        // 노출 수 데이터 그리기
        drawExposureList: function(data) {
            $("#exposureTotal").text(util.numberWithComma(data.tot_exposure));
            $("#exposureChart canvas").remove();
            
            let canvas_o = $("<canvas>");
            $("#exposureChart").append(canvas_o);

            let chartTimeData = {
                labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"],
                datasets: []
            };
            
            
            let standardYear = $("#standardMonth li.active").attr("data-year");
            let standardMonth = $("#standardMonth li.active").attr("data-month");
            
	        /* 총 노출 수 데이터 설정 */
            for(let i=0; i<3; i++) {
				let month = moment(standardYear + standardMonth).subtract(i, "months").format("MM");
		        let dataArr = [];
		        
		        // 월 별로 데이터 셋팅
		        let list = data.list;
		        for (item of list) {
		            if (item.month == month) {
		                let data = {
		                    "x": parseInt(item.day).toString(),
		                    "y": item.exposure_count,
		                };
		                dataArr.push(data);
		            }
		        }
		        
				let dataSet = {
					"data" : dataArr,
					"fill" : false,
				}
				
				if(i == 0) {
					dataSet.label = "당월";
					dataSet.backgroundColor = "rgba(86, 109, 252, 1)";
					dataSet.fill = true;
					dataSet.barThickness = 6;
      				dataSet.order = 3;
				} else if(i == 1) {
					dataSet.type = "line";
					dataSet.label = "전월";
					dataSet.borderColor = "rgba(78, 78, 78, 1)";
					dataSet.borderWidth = 1.5;
					dataSet.pointBackgroundColor = "rgba(78, 78, 78, 1)";
					dataSet.radius = 2;
					dataSet.lineTension = 0;
					dataSet.order = 1;
				} else if(i == 2) {
					dataSet.type = "line";
					dataSet.label = "전전월";
					dataSet.borderColor = "rgba(159, 159, 159, 1)";
					dataSet.borderWidth = 1.5;
					dataSet.pointBackgroundColor = "rgba(159, 159, 159, 1)";
					dataSet.radius = 2;
					dataSet.lineTension = 0;
					dataSet.order = 2;
				}
				
				chartTimeData.datasets[i] = dataSet;
			}
            /* 총 노출 수 차트 그래프 */
            new Chart(canvas_o, {
                type: "bar",
                data: chartTimeData,
                options: {
					layout: {
						padding: {
							left:0,
							top: 0,
							right: 0,
							bottom: 0,
						}
					},
                    scales: {
                        xAxes: [{
                            ticks: {
                                beginAtZero: false,
                                stepSize: 1,
                                autoSkip: false,
                                labelOffset: 3,
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 100,
                                steps: 6,
                                callback: function(value) {
									return util.numberWithComma(value);
			                    }
                            }
                        }],
                        y: {}
                    },
                    legend: {
                        display: false, //라벨숨김
                        labels: {
                            fontColor: "#404040",
                            fontFamily: "INNODAOOM-LIGHT",
                            padding: 26,
                        },
                        position: "bottom",
                        onClick: (e) => e.stopPropagation(),
                        // label 필터링 방지
                    },
                    labels: {},
                    responsive: true,
                    maintainAspectRatio: false,
                    tooltips: {
						axis: "y",
                        callbacks: {
                            title: function(tooltipItem, data) {
                                let title = data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].y;
                                return util.numberWithComma(title);
                            },
                            label: function(tooltipItem, data) {
                                let label = data.datasets[tooltipItem.datasetIndex].label;
								return label;
							}
                        },
                    },
                }
            });
        },
		
		// 집행금액 데이터 그리기
        drawPriceList: function(data) {
            $("#priceTotal").text(util.numberWithComma(data.tot_price));
            $("#priceChart canvas").remove();
            
            let canvas_o = $("<canvas>");
            $("#priceChart").append(canvas_o);

            let list = data.list;

            let standardYear = $("#standardMonth li.active").attr("data-year");
            let standardMonth = $("#standardMonth li.active").attr("data-month");
            
            let last = new Date(standardYear, standardMonth, 0);
            let dayLabels = [];

            for (let i = 1; i <= last.getDate(); i++) {
                dayLabels.push(i);
            }

            /* 총 집행금액 데이터 설정 */
            let dataArr = [];
            for (item of list) {
                let data = {
                    "x": parseInt(item.day),
                    "y": item.price,
                }
                dataArr.push(data);
            }

            let chartDailyData = {
                labels: dayLabels,
                datasets: []
            };
            
             /* 총 노출 수 데이터 설정 */
            for(let i=0; i<3; i++) {
				let month = moment(standardYear + standardMonth).subtract(i, "months").format("MM");
		        let dataArr = [];
		        
		        // 월 별로 데이터 셋팅
	            for (item of list) {
					if(item.month == month) {
		                let data = {
		                    "x": parseInt(item.day),
		                    "y": item.price,
		                }
		                dataArr.push(data);
					}
	            }
		        
				let dataSet = {
					"data" : dataArr,
					"fill" : false,
				}
				
				if(i == 0) {
					dataSet.label = "당월";
					dataSet.backgroundColor = "rgba(86, 109, 252, 1)";
					dataSet.fill = true;
					dataSet.barThickness = 6;
      				dataSet.order = 3;
				} else if(i == 1) {
					dataSet.type = "line";
					dataSet.label = "전월";
					dataSet.borderColor = "rgba(78, 78, 78, 1)";
					dataSet.borderWidth = 1.5;
					dataSet.pointBackgroundColor = "rgba(78, 78, 78, 1)";
					dataSet.radius = 2;
					dataSet.lineTension = 0;
					dataSet.order = 1;
				} else if(i == 2) {
					dataSet.type = "line";
					dataSet.label = "전전월";
					dataSet.borderColor = "rgba(159, 159, 159, 1)";
					dataSet.borderWidth = 1.5;
					dataSet.pointBackgroundColor = "rgba(159, 159, 159, 1)";
					dataSet.radius = 2;
					dataSet.lineTension = 0;
					dataSet.order = 2;
				}
				
				chartDailyData.datasets[i] = dataSet;
			}
            /* 총 집행금액 차트 그래프 */
            new Chart(canvas_o, {
                type: "bar",
                data: chartDailyData,
                options: {
                    scales: {
                        xAxes: [{
                            ticks: {
                                autoSkip: false,
                                labelOffset: 3,
                            }
                        }],
                        yAxes: [{
                            ticks: {
								maxTicksLimit: 10,
                                beginAtZero: true,
                                suggestedMax: 10000000,
                                callback: function(value) {
									return util.numberWithComma(value);
			                    }
                            }
                        }],
                    },
                    legend: {
                        display: false,
                        labels: {
                            fontColor: "#404040",
                            fontFamily: "INNODAOOM-LIGHT",
                            padding: 26,
                        },
                        position: "bottom",
                        onClick: (e) => e.stopPropagation(),
                        // label 필터링 방지
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    tooltips: {
                        axis: "y",
                        callbacks: {
                            title: function(tooltipItem, data) {
                                let title = data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].y;
                                return util.numberWithComma(title);
                            },
                            label: function(tooltipItem, data) {
                                let label = data.datasets[tooltipItem.datasetIndex].label;
								return label;
							}
                        }
                    }
                }
            });
        }
    }
    // 지도 관련 객체
     /*
     * 지도 축척 level
     * zoomlevel ~ 10(포함) : 1단계
     * zoomlevel 11 ~ 13 : 2단계
     * zoomlevel 14 ~ : 3단계
     */
    const _map = {
		map: null,
		markers : [], // 마커
   		infoWindow : [], // 팝업
   		
		// 지도 초기화
		init: function() {
			// map 레벨 해제 
			let mapOption = globalConfig.getMapOption();
			mapOption.maxZoom = 21;
			
			_map.map = new naver.maps.Map(document.getElementById("map"), mapOption);
			
			// 지도 축소/확대 시 특정 레벨로 넘어갈 때 마커 갱신
			_map.map.zoom_changed = function(zoom) {
				_map.getMarkerList();
			}
			
			// 지도 이동 시 마커 갱신
			naver.maps.Event.addListener(_map.map, "dragend", function() {
				_map.getMarkerList();
			});
			
	      	_map.getAreaList("si", true);
	        _map.getSideList();
	        _map.getMarkerList();
		},
		
        // 맵 왼쪽 사이드 바 정보
        getSideList: function() {
            let url_v = "/dashboard/supply";

            comm.send(url_v, null, "POST", function(resp) {
                if (resp.result) {
                    _map.drawSideList(resp);
                    _evInit();
                }
            });
        },

        drawSideList: function(data) {
            // 전체 매체수 
            $("#totalSupply").text(util.numberWithComma(data.supply_cnt));
            // 운영중인 상품 수
            $("#totalProduct").text(util.numberWithComma(data.product_cnt));

            // 매체 / 구분별
            let list = data.list;
            let body_o = $("#supplyBody").empty();

            for (let i = 0; i < list.length; i++) {
                let item = list[i];
                let li_o = $("<li>");
                {
                    let button_o = $("<button>").attr({
                        type: "button",
                        "data-toggle": "collapse",
                        "data-target": "#type" + item.member_id,
                    }).addClass("btn");
                    {
                        // 매체 명
                        let span_o = $("<span>").text(item.company_name);
                        button_o.append(span_o);
                    }
                    {
                        // 매체 노출 수
                        let span_o = $("<span>").text(util.numberWithComma(item.exposure_count));
                        button_o.append(span_o);
                    }
                    {
                        let i_o = $("<i>");
                        button_o.append(i_o);
                    }
                    li_o.append(button_o);

                    let categoryList = item.category_list;

                    let div_o = $("<div>").attr({
                        "id": "type" + item.member_id,
                    }).addClass("collapse type-matList");
                    for (cItem of categoryList) {
                        let ul_o = $("<ul>");
                        {
                            // 분류명 - 총 노출 수
                            let li_o = $("<li>").text(cItem.category_name + " - " + util.numberWithComma(cItem.category_count));
                            ul_o.append(li_o);
                        }
                        {
                            // 디바이스 수
                            let li_o = $("<li>").text("디바이스 수 : " + util.numberWithComma(cItem.device_count));
                            ul_o.append(li_o);
                        }
                        {
                            // 디바이스 평균 노출 수
                            let li_o = $("<li>").text("디바이스 평균 노출 수 : " + util.numberWithComma((cItem.category_count / cItem.device_count).toFixed(0)));
                            ul_o.append(li_o);
                        }
                        div_o.append(ul_o);
                    }
                    li_o.append(div_o);
                }
                body_o.append(li_o);
            }
        },
		
		// 지역 조회
        getAreaList: function(type, isInit) {
			let url_v = "/common/areacode/list";
				
			let siCode = $("#siCategory").val();
			if(siCode == "all") {
				siCode = null;
			}
			let guCode = $("#guCategory").val();
			if(guCode == "all") {
				guCode = null;
			}
				
			let data_v = {
				si_code: siCode,
				gu_code: guCode
			}
			
            comm.send(url_v, data_v, "POST", function(resp) {
                if (resp.result) {
					if(siCode == null && !isInit) {
						$("#guCategory").empty();
						$("#guCategory").append("<option value='all'>전체 지역</option>");
               			$("select[name='area']").selectpicker("refresh");
					} else if(type == "si"){
	                    _map.drawSiList(resp, "siCategory");
					} else if(type == "gu") {
	                    _map.drawGuList(resp, "guCategory");
					}
			        _evInit();
                }
            });
        },
        
        drawSiList: function(data) {
			let list = data.list;
            let category_o = $("#siCategory").empty()
            category_o.append("<option value='all'>전체 지역</option>");
			
            for (item of list) {
                option_o = $("<option>").attr({
					"data-lat" : item.si_latitude,
					"data-lng" : item.si_longitude,
				}).val(item.si_code).text(item.si_name);
                category_o.append(option_o);
            }
            $("select[name='area']").selectpicker("refresh");
		},
		
		drawGuList: function(data) {
			let list = data.list;
            let category_o = $("#guCategory").empty();
            
            let allOption_o = $("<option>").attr({
				"value" : "all",
				"data-lat" : list[0].si_latitude,
				"data-lng" : list[0].si_longitude,
			}).text("전체 지역");
            category_o.append(allOption_o);
			
            for (item of list) {
                option_o = $("<option>").attr({
					"data-lat" : item.gu_latitude,
					"data-lng" : item.gu_longitude,
				}).val(item.gu_code).text(item.gu_name);
                category_o.append(option_o);
            }
            $("select[name='area']").selectpicker("refresh");
		},
		
		// 지역 별 노출 수 (zoomlevel 별로 데이터 다름)
        getMarkerList: function() {
            let url_v = "/dashboard/area/list";
			
			let mapLevel = _map.map.getZoom();
			
            let data_v = {
                map_level: mapLevel,
            };
            
            if(mapLevel >= 14) {
				// 지도 영역안에 존재하는 차량만 조회
				let bounds = _map.map.getBounds();
				data_v.points =	bounds._max.x + " " + bounds._max.y + "," +
								bounds._max.x + " " + bounds._min.y + "," + 
								bounds._min.x + " " + bounds._min.y + "," +
								bounds._min.x + " " + bounds._max.y + "," +
								bounds._max.x + " " + bounds._max.y;
			}
            
            comm.send(url_v, data_v, "POST", function(resp) {
                if (resp.result) {
					_initMapMarker();
					if(mapLevel <= 10) {
	                    _map.drawMap(resp, 11);
					} else if(mapLevel > 10 && mapLevel <= 13) {
	                    _map.drawMap(resp, 14);
					} else {
						_map.drawCarMap(resp);
					}
                }
            });
        },
		
		// 시 / 구 별 마커 그리기
        drawMap: function(data, zoomSize) {
            let list = data.list;

            for (item of list) {
            	let marker = new naver.maps.Marker({
                    position: new naver.maps.LatLng(item.latitude, item.longitude),
                    map: _map.map,
                    icon: {
                        content: '<a href="javascript:void(0);" role="button" aria-hidden="false" aria-pressed="false" class="marker_city">' +
                            '<div class="marker_city-inner">' +
                            '<div class="city_feature">' + item.area_name + '</div>' +
                            '<div class="city_infos">' + item.area_count + '</div>' +
                            '</div>' +
                            '<div class="marker_transparent"></div>' +
                            '</a>'
                    },
                });
                
				let position = marker.getPosition();
				
				if(_map.map.getBounds().hasLatLng(position)) {
					marker.setMap(_map.map);
				} else {
					marker.setMap(null);
				}
                
                // 마커 클릭 시 이동
                naver.maps.Event.addListener(marker, "click", function() {
					_map.map.updateBy(marker.getPosition(), zoomSize);
				});
				
                _map.markers.push(marker);
            }
        },
     	
     	// 차량 별 마커 그리기
		drawCarMap: function(data) {
	        let list = data.list;
			
			for (item of list) {
				let motorData = item.motor_data;
				// 차량의 노출 수가 존재하는 경우에만 마커 표시
                if(motorData) {
					motorData.motor_exposure_count = item.motor_exposure_count;
					let iconImage = motorData.icon_image;
					if(!iconImage.startsWith("/")) {
						iconImage = globalConfig.getS3Url() + motorData.icon_image;
					}
					
	                let marker = new naver.maps.Marker({
	                    position: new naver.maps.LatLng(item.cpoint.y, item.cpoint.x),
	                    map: _map.map,
	                    icon: {
	                    	content: '<img src="' + iconImage + '" style="width:auto; height:50px;">',
            	        	size: new naver.maps.Size(50, 50),
	                    },
	                    motorData : [motorData],
	                    iconImage : iconImage
	                });
            	_map.markers.push(marker);
            	}
        	}
        	// 겹침 마커 검사
        	_map.checkMarkerIntersect();
        	
			for(marker of _map.markers) {
				if(marker.visible) {
					if(marker.count > 1) {
						let icon = {
	                    	content: '<img src="' + marker.iconImage + '" style="width:auto; height:50px;"><i class="pdct-overlap">' + marker.count + '</i>',
	            	        size: new naver.maps.Size(50, 50),
	                    }
						marker.setIcon(icon);
					}
				}
				let content_o = $("<a>").addClass("pdct bus popUp");
           		let info_o = $("<div>").css({
					"top": "95px",
					"justify-content" : "center",
					"display" : "flex",
				}).addClass("marker_town marker_pdct");
           		
				if(marker.count > 1) {
					let feature_o = $("<div>").addClass("town_feature-listWrap");
					let div_o = $("<div>");
					let ul_o = $("<ul>").addClass("town_feature-list");
					
					for(let i=0; i<marker.count; i++) {
						let motorData = marker.motorData[i];
						let li_o = $("<li>").attr({
							"data-mid" : motorData.motor_id,
							"data-src" : "dashboard",
							"data-act" : "clickInfoList",
						}).text(motorData.company_name + " " + motorData.category_name + " " + motorData.car_number);
						ul_o.append(li_o);
						div_o.append(ul_o);
						feature_o.append(div_o);
						info_o.append(feature_o);
						
						let info_inner_o = $("<div>").attr({
							"id" : "info" + motorData.motor_id,
							"data-src" : "dashboard",
							"data-act" : "clickInfoDetail",
							"data-type" : "list",
						}).addClass("marker_town-inner hidden").css("width", "fit-content");
						info_o.append(info_inner_o);
						
						_drawCommonInfo(motorData, info_inner_o);
					}
				} else {
	        		let motorData = marker.motorData[0];

					let info_inner_o = $("<div>").attr({
						"data-src" : "dashboard",
						"data-act" : "clickInfoDetail",
					}).addClass("marker_town-inner");
					info_o.append(info_inner_o);
					
					_drawCommonInfo(motorData, info_inner_o);
				}
				let marker_o = $("<div>").addClass("marker_transparent");
				info_o.append(marker_o);
                content_o.append(info_o);
            
				marker.setMap(_map.map);
        	
	        	let info = new naver.maps.InfoWindow({
					content: content_o[0],
					borderWidth: 0,
					disableAnchor: true,
					backgroundColor: "transparent",
				});
				_map.infoWindow.push(info);
			}
			for(let i=0; i<_map.markers.length; i++) {
				let marker = _map.markers[i];
				let info = _map.infoWindow[i];
				naver.maps.Event.addListener(marker, "click", function() {
					if(info.getMap()) {
						info.close();
					} else {
						if(marker.count > 1) {
							let content = info.getContent();
							$(content).find(".marker_town-inner").addClass("hidden");
							$(content).find(".town_feature-listWrap").css("display", "");
							info.setContent(content);
						}
						info.open(_map.map, marker);
						_evInit();
					}
				});
			}
		},
		
		// 차량 마커가 서로 겹치는지 검사
		checkMarkerIntersect: function() {
			let target, checked, targetBounds, checkedBounds;
        	let markerList = [];
			for(let i=0; i<_map.markers.length; i++) {
				let count = 1;
				target = _map.markers[i];
				
				if(target.visible == false) {
					continue;
				}
				for(let j=i; j<_map.markers.length; j++) {
					checked = _map.markers[j];
					
					if(target === checked) {
						continue;
					}
					
					targetBounds = target.getDrawingRect();
					checkedBounds = checked.getDrawingRect();
					
					// 마커가 겹치면 겹쳐진 마커는 제거하고 데이터는 기존 마커로 전달
					if(targetBounds.intersects(checkedBounds)) {
						count++;
						checked.setVisible(false);
						target.motorData.push(checked.motorData[0]);
					}
				}
				if(target.getVisible()) {
					target.count = count;
					markerList.push(target);
				}
			}
			_map.markers = markerList;
		}
    }
	
    const _event = {
		// 중첩 차량 마커에서 리스트 클릭
		clickInfoList: function(evo) {
			$("#info" + evo.attr("data-mid")).removeClass("hidden");
			$(evo).closest(".town_feature-listWrap").css("display", "none");
		},
		
		// 상세 팝업 클릭
		clickInfoDetail: function(evo) {
			if(evo.attr("data-type") == "list") {
				$(evo).closest(".marker_town-inner").addClass("hidden");
				$(evo).siblings(".town_feature-listWrap").css("display", "block");
			} else {
				for(info of _map.infoWindow) {
					info.close();
				}
			}
		},
		
		// 대시보드 카드 새로고침
        clickResetDate: function() {
            $("#dashboardDate").text(moment().format("YYYY-MM-DD HH:mm"));
            _card.getDetail();
        },
		
		// 그래프 월 이동
        slideMonth: function(evo) {
            let rollSlide = $(".rollingDateWrap ul");

            if (rollSlide.is(":animated")) {
                return false;
            }
            
			$("#standardMonth li").removeClass("active");
			if (evo.hasClass("rollingPrev")) {
				rollSlide.animate({
					marginLeft: 0,
				}, 500, function() {
					rollSlide.prepend(rollSlide.children().last().clone());
                    $(this).css("marginLeft", -58).children().last().remove();
				});
            	$($("#standardMonth li")[0]).addClass("active");
             } else {
				 rollSlide.animate({
                    marginLeft: -116
                }, 500, function() {
					rollSlide.append(rollSlide.children().first().clone());
                    $(this).css("marginLeft", -58).children().first().remove();
                });
            	$($("#standardMonth li")[2]).addClass("active");
			 }
            _graph.getExposureList();
            _graph.getPriceList();
        },
        
        // 지역선택 시 단위 변경
        changeSi: function(evo) {
 			$("#guCategory").selectpicker("val", "");
 			let siCode = evo.val();
 			
			let longitude = $("#siCategory [value=" + siCode + "]").attr("data-lng");
 			let latitude = $("#siCategory [value=" + siCode + "]").attr("data-lat");
 			// default
 			let mapZoomSize = 11;
 			
 			mapZoomSize = globalConfig.getMapZoomBySiCode(siCode);
 			if(siCode == "all") {
				longitude = 36.33;
				latitude = 127.77;
				$("#guCategory [value='all']").attr("data-lat", "");
				$("#guCategory [value='all']").attr("data-lng", "");
			}
			
			_map.map.updateBy(new naver.maps.LatLng(longitude, latitude), mapZoomSize);
        	_map.getMarkerList();
            _map.getAreaList("gu");
		},
		
		// 지역 선택 구 단위 변경
		changeGu: function(evo) {
 			$("#guCategory").selectpicker("val", evo.val());
 			
 			let latitude = $("#guCategory [value="+ evo.val() +"]").attr("data-lat");
 			let longitude = $("#guCategory [value="+ evo.val() +"]").attr("data-lng");
 			
 			if($("#guCategory").val() == "all") {
				_map.map.updateBy(new naver.maps.LatLng(longitude, latitude), 11);
			} else {
				_map.map.updateBy(new naver.maps.LatLng(longitude, latitude), 14);
			} 
        	_map.getMarkerList();
		},
		
		// 지도 관련 데이터 새로고침
		clickResetMapDate: function() {
       		$("#mapDate").html(moment().format("YYYY-MM-DD HH:mm") + ' 기준<i class="dateReset" data-src="dashboard" data-act="clickResetMapDate"></i>');
       		_map.getSideList();
        	_map.getMarkerList();
		},
		
		// 로딩 시 스크롤 방지
		preventScroll: function() {
			$(window).on("mousewheel", function(e) {
				if($("#loader").css("display") == "block") {
					 $("body").css("overflow", "hidden");
					 $("body").css("height", "100%");
				} else {
					 $("body").css("overflow", "overlay");
				}
			});
		},
		
		movePage: function(evo) {
			let href = evo.attr("data-href");
			let type = evo.attr("data-type");
			if(type) {
				href = href + "?type=" + type;
			}
			location.href = href;
		}
    }
	
    function _drawText(element, count1, count2) {
        let text_o = $("#" + element);
        if (parseInt(count1) > 0) {  
            text_o.html("<i>" + count1 + "</i> / " + count2);
        } else {
            text_o.html(count1 + " / " + count2);
        }
    }
	
	// 도넛 차트 그리기
    function _drawDounhnutChart(element, dataArr) {
        let body_o = $("#" + element).empty();
        let canvas_o = $("<canvas>").attr("height", "157px");

        body_o.append(canvas_o);

        const colors = ["rgba(86, 109, 252, 1)", "rgba(255, 99, 140, 1)", ];

        // 차트 데이터 설정
        const dataCpp = {
            datasets: [{
                data: dataArr,
                borderColor: colors,
                backgroundColor: colors,
            }],
            labels: [
                "진행중",
                "종료예정",
            ]
        };

        // 차트 그래프
        new Chart(canvas_o, {
            type: "doughnut",
            data: dataCpp,
            options: {
                legend: {
                    display: false,
                    labels: {
                        fontColor: "#404040",
                        fontFamily: "INNODAOOM-LIGHT",
                        padding: 40,
                    },
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }
    
    // 지도 마커 및 마커 팝업 초기화
    function _initMapMarker() {
		for(let i=0; i<_map.markers.length; i++) {
			_map.markers[i].setMap(null);
		}
		_map.markers = [];
	
		for(let i=0; i<_map.infoWindow.length; i++) {
			_map.infoWindow[i].close();
		}
		_map.infoWindow = [];
	}
	
	// month 그려주기
	function _drawStandardMonth(monthAgo, isActive) {
		let year = moment().subtract(monthAgo, "months").format("YYYY");
		let month = moment().subtract(monthAgo, "months").format("MM");
		
		let li_o = $("<li>").attr({
			"data-year" : year,
			"data-month" : month,
		}).text(year + "." + month);
		
		if(isActive) {
			li_o.addClass("active");
		}
		
		$("#standardMonth").append(li_o);
	}
	
	// 마커 팝업 창 그려주는 함수
	function _drawCommonInfo(data, parent_o) {
		let div_o = $("<div>").addClass("town_feature").text(data.company_name + " " + data.category_name + " " + data.car_number);
		parent_o.append(div_o);
		{
			let div_o = $("<div>").addClass("town_infos");
			{
				let p_o = $("<p>").text("노출 수 : " + data.motor_exposure_count);
			div_o.append(p_o);
			}
			{
				let ul_o = $("<ul>");
				div_o.append(ul_o);
				// 상품 별 노출 수
				for(let i=0; i<data.product_list.length; i++) {
					let productItem = data.product_list[i];
					{
						let li_o = $("<li>").text(productItem.product_name + " : " + productItem.motor_exposure_count);
						ul_o.append(li_o);
					}
				}
				parent_o.append(div_o);
			}
		}
	}
	
    return {
        init
    }
})()