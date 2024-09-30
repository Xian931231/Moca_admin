const areaList = (function() {
	function init() { 
		_setDatepicker();
		_list.areaCode.getList();
		_map.init();
		_evInit();
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
			if(act_v == "clickMapZoom") {
				event.clickMapZoom(evo);
			} else if(act_v == "clickPopOpen") {
				event.clickPopOpen();
			} else if(act_v == "clickPopMember") {
				event.clickPopMember(evo);
			} else if(act_v == "clickPopRemoveMember") {
				event.clickPopRemoveMember(evo);
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
		clickMapZoom: (evo) => {
			let type = $(evo).attr("data-type");
			
			let map = _map.getMap();
			
			if(type === "plus") {
				map.setZoom(map.getZoom() + 1);
			} else {
				map.setZoom(map.getZoom() - 1);
			}
		},
		
		// 팝업 오픈
		clickPopOpen: () => {
			$("#popSearchValue").val("");
			
			if(_list.member.adjustList == null) {
				_list.member.selectedList = null;
			} else {
				_list.member.selectedList = _list.member.adjustList.slice();
			}
			_list.member.drawSelectedList();
			_list.member.getList();
			
			$("#memberPop").modal("show");
		},
		
		// 팝업 선택
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
				
				let selectedmemberData = _list.member.selectedList.find(item => {
					return item.member_id === parseInt(memberData.member_id);
				});
				
				if(selectedmemberData == null) {
					_list.member.selectedList.push(memberData);
					_list.member.drawSelectedList();
				}
			}
		},
		
		// 팝업 선택 삭제
		clickPopRemoveMember: (evo) => {
			let memberId = $(evo).attr("data-id");
			
			_list.member.selectedList = _list.member.selectedList.filter((item) => {
				return item.member_id !== parseInt(memberId);
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
				$("#memberPop").modal("hide");
			}
		},
		
		// 리포트 조회 버튼 클릭
		clickSearch: () => {
			_list.report.getList();
			_map.setPosition();
			_list.map.getList();
		},
		
		// 엑셀 다운로드
		clickExcelDownload: () => {
			if(_list.report.validSearchData()) {
				let data = _list.report.getSearchData();
				util.blobFileDownload("/report/excel/byArea", data, () => {
					console.log("done");
				});
			}
		}
			
	};
	
	let _list = {
		// 광고주
		member: {
			
			// 선택 광고주 목록
			selectedList: null,
			
			// 반영된 광고주 목록
			adjustList: null,
			
			listData: null,
			
			getList: () => {
				let url_v = "/member/demand/list";
				
				let data_v = {
				};
				
				let searchValue_v = $("#popSearchValue").val();
				if(searchValue_v != null) {
					data_v.search_name = searchValue_v;
				}
				
				comm.send(url_v, data_v, "POST", function(resp) {
					_list.member.listData = resp.list;
					_list.member.drawList(resp.list);
					_evInit();
				});
			},
			
			// 목록 그리기
			drawList: () => {
				let list = _list.member.listData;
				let list_o = $("#popListBody").html("");
				
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-id": item.member_id,
						"data-name": item.company_name,
					});
					list_o.append(tr_o);
					
					{
						// 대행사
						let td_o = $("<td>").html(item.agency_company_name || '-');
						tr_o.append(td_o);
					}
					{
						// 광고주
						let td_o = $("<td>").html(item.company_name);
						tr_o.append(td_o);
					}
					{
						// 선택
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
			
			// 선택된 광고주들 그리기
			drawSelectedList: () => {
				let list_o = $("#popSelectedList").html("");
				
				let list = _list.member.selectedList;
				if(list) {
					for(let item of list) {
						let li_o = $("<li>").html("<span>"+item.company_name+"</span> &nbsp;<i class='cusDelete' data-src='list' data-act='clickPopRemoveMember' data-id='"+item.member_id+"'></i>");
						list_o.append(li_o);
					}
				}
				
				_evInit();
			}
		},
		
		// 지역 
		areaCode: {
			// 지역 목록 조회
			getList: (siCode = null,) => {
				let url_v = "/common/areacode/list";
				
				let data_v = {
					si_code: siCode,
				}
				
				comm.send(url_v, data_v, "POST", function(resp){
					_list.areaCode.drawList(resp.list, siCode);
				});
			},
			
			// 지역 목록 그리기 시,구
			drawList: (list, siCode) => {
				let key = "si";
				
				let list_o = $("#selectSiList").off("changed.bs.select");
				list_o.on("changed.bs.select", function(e, clickedIndex){
					let value = $(e.currentTarget).val();
					_list.areaCode.getList(value);
				});
				if(siCode != null) {
					list_o = $("#selectGuList");
					key = "gu";
				}
				list_o.html("");
				
				for(let i=0; i<list.length; i++) {
					let item = list[i];
					if(i == 0) {
						list_o.append("<option value='all'>전체 지역</option>");
					}
					let option_o = $("<option>").html(item[key + "_name"]).attr({
						"data-id": item[key + "_code"],
						"value": item[key + "_code"],
						"data-lat": item[key + "_latitude"],
						"data-lng": item[key + "_longitude"],
					});
					list_o.append(option_o);
				}
				
				list_o.selectpicker("refresh");
			},
		},
		
		// 리포트
		report: {
			
			validSearchData: () => {
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
				
				if(data.member_list == null) {
					return false;
				}
				
				if(data.member_list.length == 0) {
					return false;
				}
				
				if(!data.map_level) {
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
				
				let memberList = null; 
				if(_list.member.adjustList) {
					memberList = _list.member.adjustList.map(item => {
						return item.member_id;
					});
				}
				
				let data = {
					start_date: startDate_v,
					end_date: endDate_v,
					start_hour: startHour_v,
					end_hour: endHour_v,
					member_list: memberList,
					map_level: _map.instance.getZoom(),
				}
				
				let siCode_v = $("#selectSiList").val();
				if(siCode_v && siCode_v != "all") {
					data.si_code = siCode_v;
				}
				
				let guCode_v = $("#selectGuList").val();
				if(guCode_v && guCode_v != "all") {
					data.gu_code = guCode_v;
				}
				
				return data;
			},
			
			getList: () => {
				let url_v = "/report/list/byArea";
				
				let data_v = _list.report.getSearchData();
				
				if(_list.report.validSearchData()) {
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
//						_list.report.drawChartTable(listData);
//						_chart.drawChart(listData);
						_list.report.drawTable(listData);
					});
				}
			},
			
			drawTable: (list) => {
				let total = 0;
				let list_o = $("#listBody").html("");
				
				for(let i=0; i<list.length; i++) {
					let item = list[i];
					
					let tr_o = $("<tr>");
					list_o.append(tr_o);
					
					// 대행사
					let th_o = $("<th>").html(item.company_name).attr("rowspan", item.rowspan);
					tr_o.append(th_o);
					
					// 광고주
					let demandList = item.demand_list;
					if(demandList) {
						for(let j=0; j<demandList.length; j++) {
							let demandItem = demandList[j];
							
							if(j > 0) {
								tr_o = $("<tr>");
								list_o.append(tr_o);
							}
							
							let th_o = $("<th>").html(demandItem.company_name).attr("rowspan", demandItem.rowspan);
							tr_o.append(th_o);
							
							let siList = demandItem.si_list;
							if(siList) {
								for(let k=0; k<siList.length; k++) {
									let siItem = siList[k];
									
									if(k > 0) {
										tr_o = $("<tr>");
										list_o.append(tr_o);
									}
									
									// 지역
									let td_o = $("<td>").html(siItem.si_name).attr("rowspan", siItem.rowspan);
									tr_o.append(td_o);
									
									let guList = siItem.gu_list;
									if(guList) {
										for(let l=0; l<guList.length; l++) {
											let guItem = guList[l];
											
											if(l > 0) {
												tr_o = $("<tr>");
												list_o.append(tr_o);
											}
											{
												// 지역 구분 
												let td_o = $("<td>").html(guItem.gu_name);
												tr_o.append(td_o);
											}
											{
												// 노출량
												let td_o = $("<td>").html(util.numberWithComma(guItem.cnt));
												tr_o.append(td_o);
											}
											
											total += guItem.cnt;
										}
									} else {
										{
											// 지역 구분
											let td_o = $("<td>").html("-");
											tr_o.append(td_o);
										}
										{
											// 노출량
											let td_o = $("<td>").html(util.numberWithComma(areaItem.cnt));
											tr_o.append(td_o);
										}
										total += areaItem.cnt;
									}
								}
							}
						}
					}
					$("#listBodyTotal").html(util.numberWithComma(total));
				}
			}
		},
		
		map: {
			getList: () => {
				if(_list.report.validSearchData()) {
					let url_v = "/report/list/byAreaMap";
					let data_v = _list.report.getSearchData();
					
					comm.send(url_v, data_v, "POST", function(resp) {
						// 지도에 표시된 마커 지우기 
						_map.clearMarker();
						_map.setMap(resp.list);
					});
				}
			}
		}
	}
	
	let _map = {
			
		markers: null,
			
		instance: null,
		
		init: () => {
			let mapInstance = new naver.maps.Map('mapWrap', globalConfig.getMapOption());
			_map.instance = mapInstance;
			
			mapInstance.zoom_changed = (zoom) => {
				// 변경된 지도 레벨에 따라 지도 데이터 가져오기.
				_list.map.getList();
			}
		},
		
		getMap: () => {
			return _map.instance;
		},
		
		setPosition: () => {
			let mapZoom = globalConfig.getMapZoomBySiCode("all");
			let mapLat = 127.77;
			let mapLng = 36.33;
			
			let siCode_o = $("#selectSiList option:selected");
			let siCode_v = siCode_o.val();
			if(siCode_v && siCode_v != "all" && siCode_v != "") {
				mapZoom = globalConfig.getMapZoomBySiCode(siCode_v);
				mapLat = siCode_o.attr("data-lat");
				mapLng = siCode_o.attr("data-lng");
			}
			
			let guCode_o = $("#selectGuList option:selected");
			let guCode_v = guCode_o.val();
			if(guCode_v && guCode_v != "all" && guCode_v != "") {
				mapZoom = 14;
				mapLat = guCode_o.attr("data-lat");
				mapLng = guCode_o.attr("data-lng");
			}
			
			_map.instance.updateBy(new naver.maps.LatLng(mapLng, mapLat), mapZoom);
		},
		
		setMap: (list) => {
			let list_o = $("#mapMarkerDiv").html("");
			for(let item of list) {
				let marker_o = "<a class='marker_city' href='javascript:;' role='button' 'aria-hidden': false, 'aria-pressed': false>";
					marker_o += "<div class='marker_city-inner'>";
					marker_o += "<div class='city_feature'>";
					marker_o += item.display_name;
					marker_o += "</div>";
					marker_o += "<div class='city_infos'>";
					marker_o += util.numberWithComma(item.cnt);
					marker_o += "</div>";
					marker_o += "<div class='marker_transparent'>";
					marker_o += "</div>";
					marker_o += "</div>";
				
				let position = new naver.maps.LatLng(item.latitude, item.longitude);
				
				let marker = new naver.maps.Marker({
					position: new naver.maps.LatLng(item.latitude, item.longitude),
					map: _map.getMap(),
					icon: {
						content: marker_o,
					},
				});
				
				marker.addListener("mouseover", (e) => {
					e.overlay.setZIndex(1000);
				});
				
				marker.addListener("mouseout", (e) => {
					e.overlay.setZIndex(100);
				});
				
				if(_map.markers === null) {
					_map.markers = [];
				}
				
				_map.markers.push(marker);
			}
		},
		
		clearMarker: () => {
			if(_map.markers && _map.markers.length > 0) {
				_map.markers.forEach(function(marker) {
					marker.setMap(null);
				});
				_map.markers = [];
			}
		}
	};
	
	return {
		init,
//		getMap: _map.getMap,
//		_map,
	}
})();