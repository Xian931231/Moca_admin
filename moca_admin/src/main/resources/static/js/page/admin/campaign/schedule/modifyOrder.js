const scheduleModifyOrder = (function () {
	
	let _urlParam = util.getUrlParam();
	
	// 슬롯 idx
	let _slotIdx = 0;
	
	// 편성표 상품에 속한 광고 목록
	let _productSgList = [];
	
	// 해당 페이지 초기화 함수
	function init(){
		if(!_urlParam || !_urlParam.product_id) {
			location.href = "/campaign/schedule/list";
		} else {
			_data.getDetail();
			_data.productSgList();
		}
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='scheduleModifyOrder'][data-act]").off();
		evo.on("click", function(ev){
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
			 if(act_v == "clickModifyCancle") {
				event.clickModifyCancle();
			} else if(act_v == "clickShowCppOrderModal") {
				event.clickShowCppOrderModal(evo);
			} else if(act_v == "clickModifyCppOrder") {
				event.clickModifyCppOrder();
			} else if(act_v == "clickSwapCppSg") {
				event.clickSwapCppSg(evo);
			} else if(act_v == "clickModifyOrder") {
				event.clickModifyOrder();
			}
		}
	}
	
	// 데이터
	const _data = {
		// 편성표 상세 정보
		getDetail: function() {
			let url_v = "/campaign/schedule/modify/order/detail";
			
			let data_v = {
				product_id: _urlParam.product_id,
			}

			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					_data.setDetailData(resp.data);
				} else {
					location.href = "/campaign/schedule/list";
				}
			});
		},
		
		// 상품에 속한 광고 리스트
		productSgList: function() {
			let url_v = "/campaign/schedule/product/sg/list";
			
			let data_v = {
				product_id: _urlParam.product_id,
			}

			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					_productSgList = resp.list;
				}
			});
		},
			
		// 상세 정보 설정
		setDetailData: function(data) {
			// 카테고리 정보
			$("#productInfo").text(data.supply_name + " > " + data.category_name + " > " + data.product_name);
			
			// 슬롯 정보
			$.each(data.slot_list, function(i, slotData) {
				let slot_o = _drawSlot();
					
				_data.setSlotData(slot_o, slotData);
			});
			
			_evInit();
		},
		
		// 슬롯 정보 설정
		setSlotData: function(slot_o, data) {
			let slotNum = $(slot_o).find(".slotNum").text();
			let slotType = data.slot_type;
			
			$(slot_o).attr({
				"data-sg-id"					: data.sg_id,
				"data-slot-id"					: data.slot_id,
				"data-schedule-product-slot-id" : data.schedule_product_slot_id,
				"data-cpp-sec" 					: data.play_time,
			});
			
			if(slotType == "C") {
				// CPP 시간 설정
				$("#cppSec_" + slotNum).text(data.play_time + "초");
				$("#sgName_" + slotNum).text(data.sg_name);
				
				// 지정순서 변경 버튼 추가 
				let orderBtn_o = $("<button>").addClass("btn btn-dark")
				.attr({
					"type"			: "button",
					"data-src"		: "scheduleModifyOrder",
					"data-act"		: "clickShowCppOrderModal",
				}).text("지정순서 변경");
				
				$(slot_o).append(orderBtn_o);
			} else {
				$(slot_o).addClass("slotFixed");
				
				let blockBtn = $(slot_o).find(".slotBtnWrap > .btn-block");
				// 블록 슬롯 보이기
				_event.clickBlockBtn(blockBtn);
				
				let sortInfo = JSON.parse(data.sort_info);
				// 블록 슬롯 설정
				$.each(sortInfo, function(i, sortData){
					let sortType = sortData.sort_type;
					let useYn = sortData.use_yn;
					
					$(slot_o).find(".slotBlock.actShow button").each(function(idx, btn_o){
						let value = $(btn_o).val();
					
						// 사용 여부설정
						if(useYn == "N") {
							if(value == sortType) {
								$(btn_o).addClass("dis");
								$(btn_o).attr("disabled", false);
							}
						}
						// 공익, 디폴트, CPM광고 순서 설정
						if(sortType != "area" && sortType != "time") {
							if(value == sortType) {
								$(slot_o).find(".dragBtnGroup").append(btn_o);
							}
						}
					});
				});
			}
		},
		
		// 등록 데이터 가져오기
		getSubmitData: function() {
			let data = {};
			
			// 편성표 id
			data.product_id = _urlParam.product_id;
			
			// 슬롯 정보
			data.slot_list = _data.getSlotDataList();
			
			return data;
		},
		
		// 슬롯 데이터 가져오기
		getSlotDataList: function() {
			let slotDataList = [];
			
			$("#slotList").children("li").each(function(i, li_o) {
				let slotData = {};

				let scheduleProductSlotId = $(li_o).attr("data-schedule-product-slot-id");
				let sgId = $(li_o).attr("data-sg-id");

				// SG 아이디가 있는 슬롯만 저장
				if(sgId) {
					slotData.schedule_product_slot_id = Number(scheduleProductSlotId);
					slotData.sg_id = Number(sgId);
					
					slotDataList.push(slotData);
				}
			});
			return slotDataList;
		},
	}
	
	// 이벤트 담당
	const _event = {
		// 편성표 수정 취소
		clickModifyCancle: function() {
			location.href = "/campaign/schedule/list";
		},
		
		// 슬롯에서 Block 버튼 클릭
		clickBlockBtn: function(evo) {
		   evo.siblings().removeClass("act");
		   evo.addClass("act");
		   evo.parent().next().children().next().addClass("actShow");
		   evo.parent().next().children().prev().removeClass("actShow");
		},
		
		// 편성표 CPP 지정 순서 변경 
		clickModifyCppOrder: function() {
			let data_v = _data.getSubmitData();
			
			if(!_validateSubmitData(data_v)) {
				return;
			}
			
			let url_v = "/campaign/schedule/modify/order";
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					location.href = "/campaign/schedule/list"
				}
			});
		},
		
		// CPP 지정 순서 변경 모달
		clickShowCppOrderModal: function(evo) {
			_drawSgList(evo);
			_evInit();
			$("#cppOrderModal").modal("show");
		},
		
		// CPP 광고 지정 순서 변경
		clickSwapCppSg: function(evo) {
			let selectedSgId = evo.attr("data-sg-id");
			let selectedSlotId = evo.attr("data-slot-id");
			
			let swapEl1 = null;
			let swapEl2 = null;
			
			// 선택한 상품 id를 가지고 있는 슬롯과 선택한 슬롯을 찾는다.
			$("#slotList").find("li").each(function(i, o) {
				let sgId = $(o).attr("data-sg-id");
				let slotId = $(o).attr("data-slot-id");
				
				if(selectedSgId == sgId) {
					swapEl1 = o;
				}
				if(selectedSlotId == slotId) {
					swapEl2 = o;
				}
			});

			// 정보 스왑 
			_swapCppSlotData([swapEl1, swapEl2]);
			
			$("#cppOrderModal").modal("hide");
		},
		
		// 순서 변경 수정
		clickModifyOrder: function() {
			let url_v = "/campaign/schedule/modify/order";
			
			let data_v = _data.getSubmitData();
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					location.href = "/campaign/schedule/list";
				}
			});
		}
	}
	
	// CPP 슬롯정보 스왑(sgID, 광고 이름)
	function _swapCppSlotData(swapElList) {
		let swapData = {};
		
		$.each(swapElList, function(i, el) {
			swapData["sgId" + i] = $(el).attr("data-sg-id");
			swapData["sgName" + i] = $(el).find(".slotCpp.actShow span:eq(1)").text();
		});
		
		$.each(swapElList, function(i, el) {
			let idx = i == 0 ? 1 : 0;
			
			$(el).attr("data-sg-id", swapData["sgId" + idx] ? swapData["sgId" + idx] : null)
				.find(".slotCpp.actShow span:eq(1)")
				.text(swapData["sgName" + idx]);
		});
	}
	
	// 슬룻 그리기
	function _drawSlot() {
		let count =  ++_slotIdx;
		
		let slotList_o = $("#slotList");

		let realSlotCnt = slotList_o.find("li").length + 1;
		
		let li_o;
		{
			li_o = $("<li>");
			{
				// 넘버링 div 
				let numDiv_o = $("<div>").addClass("slotNum").text(realSlotCnt);
				li_o.append(numDiv_o);
			}
			{
				// 슬롯 버튼 div
				let slotDiv_o = $("<div>").addClass("slotBtnWrap");
				li_o.append(slotDiv_o);
				{
					// CPP 버튼
					let cppBtn_o = $("<button>").addClass("btn btn-cpp act").attr({
						"type"		: "button",
						"value"		: "C",
						"disabled"	: true,
					}).text("CPP");
					slotDiv_o.append(cppBtn_o);

					// BLOCK 버튼
					let blockBtn_o = $("<button>").addClass("btn btn-block").attr({
						"type"		: "button",
						"value"		: "B",
						"disabled"	: true,
					}).text("Block");
					slotDiv_o.append(blockBtn_o);
				}
			}
			{
				// 스위치 div
				let swichDiv_o = $("<div>").addClass("switchBoxWrap");
				li_o.append(swichDiv_o);
				{
					// 스위치 cpp 
					let switchCppDiv_o = $("<div>").addClass("selectRadio slotCpp switchBox actShow");
					swichDiv_o.append(switchCppDiv_o);
					{
						// 초
						let secSpan_o = $("<span>").attr("id", "cppSec_" + _slotIdx);
						switchCppDiv_o.append(secSpan_o);
						// 광고 제목
						let sgNameSpan_o = $("<span>").attr("id", "sgName_" + _slotIdx);;
						switchCppDiv_o.append(sgNameSpan_o);
					}
					
					// 스위치 block
					let switchBlockDiv_o = $("<div>").addClass("slotBlock switchBox");
					swichDiv_o.append(switchBlockDiv_o);
					{
						let orderSpan_o = $("<span>").text("우선 노출 순위");
						switchBlockDiv_o.append(orderSpan_o);
						
						// 지역 btn 
						let areaBtn_o = $("<button>").addClass("btn btn-def").attr({
							"type"		: "button",
							"value"		: "area",
							"disabled" 	: true,
						}).text("지역");
						{
							let i_o = $("<i>");
							areaBtn_o.append(i_o);
						}
						switchBlockDiv_o.append(areaBtn_o);
						
						// 시간 btn
						let timeBtn_o = $("<button>").addClass("btn btn-def").attr({
							"type"		: "button",
							"value"		: "time",	
							"disabled" 	: true,
						}).text("시간");
						{
							let i_o = $("<i>");
							timeBtn_o.append(i_o);
						}
						switchBlockDiv_o.append(timeBtn_o);
						
						// 드레그 정렬 그룹
						let dragSpan_o = $("<span>").addClass("dragBtnGroup square-section").attr("id", "dragBtnGroup" + count);
						{
							// 공익광고 btn
							let publicBtn_o = $("<button>").addClass("btn btn-opt").attr({
								"type"		: "button",
								"value"		: "public",	
							}).text("공익 광고");
							{
								let i_o = $("<i>");
								publicBtn_o.append(i_o);
							}
							dragSpan_o.append(publicBtn_o);
							
							// 디폴트 btn
							let defaultBtn_o = $("<button>").addClass("btn btn-opt").attr({
								"type"		: "button",
								"value"		: "default",
							}).text("디폴트");
							{
								let i_o = $("<i>");
								defaultBtn_o.append(i_o);
							}
							dragSpan_o.append(defaultBtn_o);
							
							// CPM btn
							let cpmBtn_o = $("<button>").addClass("btn btn-opt").attr({
								"type"		: "button",
								"value"		: "CPM",
							}).text("CPM");
							{
								let i_o = $("<i>");
								cpmBtn_o.append(i_o);
							}
							dragSpan_o.append(cpmBtn_o);
						}
						switchBlockDiv_o.append(dragSpan_o);
					}
				}
			}
			slotList_o.append(li_o);
		}
		return li_o;
	}

	// 상품 목록 그리기
	function _drawSgList(evo) {
		let cppSec = evo.parent().attr("data-cpp-sec");
		let slotId = evo.parent().attr("data-slot-id");
		
		// 해당 플레이 타임만 필터링
		let sgList = _productSgList.filter(data => data.exposure_time == cppSec);
		
		let body_o = $("#sgListBody").empty();
		
		$.each(sgList, function(i, item){
			let tr_o = $("<tr>");	
			{
				// 지정 버튼
				let td_o = $("<td>");
				let btn_o = $("<button>").addClass("btn-appo")
				.attr({
					"type"			: "button",
					"data-sg-id"	: item.sg_id,
					"data-slot-id"	: slotId,
					"data-src"		: "scheduleModifyOrder",
					"data-act"		: "clickSwapCppSg"
				}).text("지정");
				
				td_o.append(btn_o);
				tr_o.append(td_o);
			}
			{
				// 광고 이름
				let td_o = $("<td>").text(item.sg_name);
				tr_o.append(td_o);
			}
			{
				// 소재 종류
				let sgMaterial = "";
				if(item.material_kind == "IMAGE") {
					sgMaterial = "이미지";
				} else if(item.material_kind == "VIDEO") {
					sgMaterial = "동영상";
				}
				let td_o = $("<td>").text(sgMaterial);
				tr_o.append(td_o);
			}
			{
				// 광고 진행 기간
				let td_o = $("<td>").text(item.start_ymd + " ~ " + item.end_ymd);
				tr_o.append(td_o);
			}
			body_o.append(tr_o);
		});
	}
	
	return {
		init
	}
	
})();