const scheduleModify = (function () {
	
	let _urlParam = util.getUrlParam();
	
	// 슬롯 증가값
	let _slotIdx = 0;
	
	// 등록 가능한 상품 리스트
	let _productList = [];
	
	// 추가된 상품 id 리스트 
	let _addProductIdList = [];
	
	// 삭제된 슬롯 id 리스트
	let _removeSlotIdList = [];
	
	// 삭제된 상품 id 리스트
	let _removeProductIdList = [];
	
	// 매체 필터 리스트
	let _supplyFilterList = [];
	
	// 분류 필터 리스트
	let _categoryFilterList = [];
	
	// 상품 필터 리스트  
	let _productFilterList = [];
	
	// 해당 페이지 초기화 함수
	function init(){
		if(!_urlParam || !_urlParam.schedule_id) {
			location.href = "/campaign/schedule/list";
		} else {
			_data.getRemainProductList();
			_data.getDetail();
		}
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='scheduleModify'][data-act]").off();
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
			if(act_v == "clickAddSlot") {
				event.clickAddSlot();
			} else if(act_v == "clickRemoveSlot") {
				event.clickRemoveSlot(evo);
			} else if(act_v == "clickCppBtn") {
				event.clickCppBtn(evo);
			} else if(act_v == "clickBlockBtn") {
				event.clickBlockBtn(evo);
			} else if(act_v == "clickToggleOrderSort") {
				event.clickToggleOrderSort(evo);
			} else if(act_v == "clickProductApply") {
				event.clickProductApply();
			} else if(act_v == "clickRemoveProduct") {
				event.clickRemoveProduct(evo);
			} else if(act_v == "clickModifyCancle") {
				event.clickModifyCancle();
			} else if(act_v == "clickModifySchedule") {
				event.clickModifySchedule();
			}
		} else if(type_v == "change") {
			if(act_v == "changeSupply") {
				_data.setCategorySelectBox();
			} else if(act_v == "changeCategory") {
				_data.setProductSelectBox();
			}
		}
	}
	
	// 데이터
	const _data = {
		// 편성표 상세 정보
		getDetail: function() {
			let url_v = "/campaign/schedule/detail";
			
			let data_v = {
				schedule_id: _urlParam.schedule_id,
			}

			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					_data.setDetailData(resp.data);
				} else {
					location.href = "/campaign/schedule/list";
				} 
			});
		},
			
		// 편성표에 등록 가능한 남은 상품
		getRemainProductList: function() {
			let url_v = "/campaign/schedule/product/remain/list";
			
			let data_v = {};
			
			if(_urlParam && _urlParam.schedule_id) {
				data_v.except_schedule_id = _urlParam.schedule_id;
			}
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					_productList = resp.list;
					_data.setSupplySelectBox();
				}
			});
		},
		
		// 상세 정보 설정
		setDetailData: function(data) {
			// 편성표 이름
			$("#scheduleName").val(util.unescapeData(data.schedule_name));
			
			// 슬롯 정보
			$.each(data.slot_list, function(i, slotData) {
				let slot_o = _drawSlot();
				
				_data.setSlotData(slot_o, slotData);
				
				_createSortable();
			});
			
			// 상품 정보 
			$.each(data.product_list, function(i, productData) {
				let productId = productData.product_id;
				
				_drawApplyProduct(productData);
				
				_removeSelectBoxOption("productList", productId);
				
				_addSelectBoxFilter(productId);
			});

			_evInit();
			_initSelectBox();
		},
		
		// 슬롯 정보 설정
		setSlotData: function(slot_o, data) {
			let slotNum = $(slot_o).find(".slotNum").text();
			let slotType = data.slot_type;
			
			$(slot_o).attr({
				"data-slot-id" 			: data.slot_id,
				"data-origin-slot-type"	: data.slot_type
			});
			
			if(slotType == "C") {
				// 진행중인 CPP광고
				if(data.matching_sg_cnt) {
					$(slot_o).addClass("slotFixed");
					$(slot_o).find(".slotCpp.actShow").append("<div>광고가 진행중인 슬롯은 수정할 수 없습니다.</div>");
				}
				
				let playTime = data.play_time;

				// CPP 시간 설정
				if(playTime == 15) {
					$("#cppSec15_" + slotNum).prop("checked", true);
				} else {
					$("#cppSec30_" + slotNum).prop("checked", true);
				}
			} else {
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
		
		// 매체 셀렉트 박스 데이터 설정 
		setSupplySelectBox: function() {
			let select_o = $("#supplyList").empty();
			select_o.selectpicker("destroy");

			// 기본 옵션 
			let basicOption_o = $("<option>").val("").text("전체 매체");
			select_o.append(basicOption_o);
			
			let list = _productList;  
			
			for(let item of list) {
				// 필터링된 매체 제외
				if(!_supplyFilterList.includes(item.member_id)) {
					let option_o = $("<option>").val(item.member_id).text(item.company_name);
					select_o.append(option_o);
				}
			}
			select_o.selectpicker();
			
			_data.setCategorySelectBox();
		},
		
		// 분류 셀렉트 박스 데이터 설정 
		setCategorySelectBox: function() {
			let select_o = $("#categoryList").empty();
			select_o.selectpicker("destroy");
			
			// 기본 옵션 
			let basicOption_o = $("<option>").val("").text("전체 분류");
			select_o.append(basicOption_o);
			
			let memberId = $("#supplyList").val();
			if(memberId) {
				let categoryList = _productList.filter(supply => supply.member_id == memberId)[0].category_list;
				
				for(let item of categoryList) {
					// 필터링된 분류 제외
					if(!_categoryFilterList.includes(item.category_id)) {
						let option_o = $("<option>").val(item.category_id).text(item.category_name);
						select_o.append(option_o);
					}
				}
			}
			select_o.selectpicker();
			
			_data.setProductSelectBox();
		},
		
		// 상품 셀렉트 박스 데이터 설정 
		setProductSelectBox: function() {
			let select_o = $("#productList").empty();
			select_o.selectpicker("destroy");
			
			// 기본 옵션 
			let basicOption_o = $("<option>").val("").text("전체 상품");
			select_o.append(basicOption_o);
		
			let memberId = $("#supplyList").val();
			let categoryId = $("#categoryList").val();
			if(categoryId){
				let productList = _productList.filter(supply => supply.member_id == memberId)[0].category_list
					                          .filter(category => category.category_id == categoryId)[0].product_list;
				
				for(let item of productList) {
					// 이미 적용된 상품은 제외
					if(!_productFilterList.includes(item.product_id)) {
						let option_o = $("<option>").val(item.product_id).text(item.product_name);
						select_o.append(option_o);
					}
				}
			}
			select_o.selectpicker();
		},
		
		// 등록 데이터 가져오기
		getSubmitData: function() {
			let data = {};
			
			// 편성표 id
			data.schedule_id = _urlParam.schedule_id;
			
			// 편성표 이름
			data.schedule_name = $("#scheduleName").val().trim();
			
			// 슬롯 정보
			data.slot_list = _data.getSlotDataList();
			
			// 삭제 슬롯 아이디 리스트 
			data.remove_slot_id_list = _removeSlotIdList;
			
			// 추가 상품 아이디 리스트
			data.product_id_list = _addProductIdList;
			
			// 삭제 편성표 상품 아이디 리스트
			data.remove_schdule_product_id_list = _removeProductIdList;
			
			return data;
		},
		
		// 슬롯 데이터 가져오기
		getSlotDataList: function() {
			let slotDataList = [];
			
			$("#slotList").children("li").each(function(i, li_o){
				let slotData = {};

				let slotId = $(li_o).attr("data-slot-id");
				
				// 슬롯 타입(C: CPP, B: Block)
				let slotType = $(li_o).find(".slotBtnWrap > .btn.act").val();
				slotData.slot_type = slotType;
				
				// slotId가 있으면 기존에 등록된 슬롯
				if(slotId) {
					let originSlotType = $(li_o).attr("data-origin-slot-type");
					
					// 기존 슬롯 타입이 다른 타입으로 변경되면 삭제 후 재 등록
					if(originSlotType == slotType) {
						slotData.schedule_slot_id = Number(slotId);
					} else {
						// 삭제 리스트 추가
						_removeSlotIdList.push(Number(slotId));
					}
				}
				
				// 슬롯 순서
				slotData.slot_order = i + 1;
				
				if(slotType == "C") { 
					// CPP 광고 시간
					let playTime = $(li_o).find(".selectRadio.slotCpp.actShow input[type='radio']:checked").val();
					slotData.play_time = Number(playTime);
				} else { 
					// 우선 노출 순위 정보
					let sortInfoList = [];
					
					$(li_o).find(".slotBlock.actShow button").each(function(idx, btn_o){
						let sortInfo = {};
						let sortType = $(btn_o).val();
						
						sortInfo.order = idx + 1;
						sortInfo.sort_type = sortType;
						sortInfo.use_yn = $(btn_o).hasClass("dis") ? "N" : "Y";
						
						sortInfoList.push(sortInfo);
					});
					slotData.sort_info = sortInfoList;
				}
				slotDataList.push(slotData);
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
			
		// 광고 슬롯 추가 
		clickAddSlot: function() {
			_drawSlot();
			_createSortable();
			_evInit();
			_initSelectBox();
		},
	
		// CPP, Block 슬롯 스위치
		clickCppBtn: function(evo) {
			evo.siblings().removeClass("act");
	        evo.addClass("act");
	        evo.parent().next().children().prev().addClass("actShow");
	        evo.parent().next().children().next().removeClass("actShow");
		},
		
		// 슬롯에서 Block 버튼 클릭
		clickBlockBtn: function(evo) {
		   evo.siblings().removeClass("act");
		   evo.addClass("act");
		   evo.parent().next().children().next().addClass("actShow");
		   evo.parent().next().children().prev().removeClass("actShow");
		},
		
		// 슬롯 삭제
		clickRemoveSlot: function(evo) {
			let parent_o = evo.parent();

			let slotId = parent_o.attr("data-slot-id");
			if(slotId) {
				_removeSlotIdList.push(Number(slotId));
			}
			parent_o.remove();
			_slotReCount();
		},
		
		// 우선 순위 노출 토글
		clickToggleOrderSort: function(evo) {
			evo.parent().toggleClass("dis");
		},
		
		// 상품 선택 
		clickProductApply: function() {
			let productSelect_o = $("#productList");
			let productId = productSelect_o.val();
			
			if(!productId) {
				return;
			}
			
			let companyName = $("#supplyList option:checked").text();
			let categoryName = $("#categoryList option:checked").text();
			let productName = $("#productList option:checked").text();
			
			let data = {
				company_name: companyName,
				category_name: categoryName,
				product_name: productName,
				product_id: productId,
			}
			
			// 상품 목록 그리기 
			_drawApplyProduct(data);
			
			// 상품 ID 추가 ( 기존에 등록된 상품 때문에 새로 추가되는 상품 ID는 따로 관리 )
			_addProductIdList.push(Number(productId));
			
			// 선택 항목 제거
			_removeSelectBoxOption("productList", productId);
			
			// 셀렉트박스에서 안나오도록 필터링 처리 
			_addSelectBoxFilter(productId);
		}, 
		
		// 상품 삭제
		clickRemoveProduct: function(evo) {
			let li_o = evo.parent().parent();
			
			let scheduleProductId = li_o.attr("data-schedule-product-id");
			let productId = li_o.attr("data-product-id");
			let matchingCppCnt = li_o.attr("data-matching-cnt");
			
			// CPP광고 중인 상품은 삭제 불가
			if(matchingCppCnt && Number(matchingCppCnt) > 0) {
				customModal.alert({
					content: "CPP 광고가 진행중인 상품은 삭제 하실 수 없습니다.",
				});
				return;
			}
			
			if(scheduleProductId) {
				_removeProductIdList.push(Number(scheduleProductId));
			}
			
			// 삭제 상품 필터링 제거
			_removeSelectBoxFilter(productId);
			
			li_o.remove();
		}, 
		
		// 편성표 수정 
		clickModifySchedule: function() {
			let data_v = _data.getSubmitData();
			
			console.log(data_v);
			
			if(!_validateSubmitData(data_v)) {
				return;
			}
			
			let url_v = "/campaign/schedule/modify";
			
			comm.send(url_v, data_v, "POST", function(resp) {
				let msg = "";
				
				if(resp.result) {
					location.href = "/campaign/schedule/list";
				} else if(resp.code == 8005) {
					msg = "이미 등록된 상품입니다.<br>";
					resp.registered_product_list.forEach(productName => {
						msg += "<br>" + productName;
					});
				} else if(resp.code == 8006) {
					msg = "유효하지 않은 상품입니다.<br><br>";
					resp.invalid_product_list.forEach(productName => {
						msg += "<br>" + productName;
					});
				}
				
				if(msg) {
					customModal.alert({
						content: msg,
					});
				}
			});
		}
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
						"data-src"	: "scheduleModify",
						"data-act"	: "clickCppBtn",
					}).text("CPP");
					slotDiv_o.append(cppBtn_o);

					// BLOCK 버튼
					let blockBtn_o = $("<button>").addClass("btn btn-block").attr({
						"type"		: "button",
						"value"		: "B",
						"data-src"	: "scheduleModify",
						"data-act"	: "clickBlockBtn",
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
						// 15초
						let sec15Div_o = $("<div>");
						{
							let sec15Radio_o = $("<input>").attr({
								"type"		: "radio",
								"id"		: "cppSec15_" + count,
								"name"		: "cppSec_" + count,
								"value"		: "15",
								"checked"	: true,
							});
							let sec15Label_o = $("<label>").attr({
								"for": "cppSec15_" + count,
							});
							let sec15Span_o = $("<span>").text("15초");
							sec15Div_o.append(sec15Radio_o);
							sec15Label_o.append(sec15Span_o);
							sec15Div_o.append(sec15Label_o);
						}
						switchCppDiv_o.append(sec15Div_o);
						
						// 30초
						let sec30Div_o = $("<div>");
						{
							let sec30Radio_o = $("<input>").attr({
								"type"		: "radio",
								"id"		: "cppSec30_" + count,
								"name"		: "cppSec_" + count,
								"value"		: "30",
							});
							let sec30Label_o = $("<label>").attr({
								"for": "cppSec30_" + count,
							});
							let sec30Span_o = $("<span>").text("30초");
							sec30Div_o.append(sec30Radio_o);
							sec30Label_o.append(sec30Span_o);
							sec30Div_o.append(sec30Label_o);
						}
						switchCppDiv_o.append(sec30Div_o);
					}
					
					// 스위치 block
					let switchBlockDiv_o = $("<div>").addClass("slotBlock switchBox");
					swichDiv_o.append(switchBlockDiv_o);
					{
						let orderSpan_o = $("<span>").text("우선 노출 순위");
						switchBlockDiv_o.append(orderSpan_o);
						
						// 지역 btn 
						let areaBtn_o = $("<button>").addClass("btn btn-def").attr({
							"type"	: "button",
							"value"	: "area"	
						}).text("지역");
						{
							let i_o = $("<i>").attr({
								"data-src"	: "scheduleModify",
								"data-act"	: "clickToggleOrderSort",
							});
							areaBtn_o.append(i_o);
						}
						switchBlockDiv_o.append(areaBtn_o);
						
						// 시간 btn
						let timeBtn_o = $("<button>").addClass("btn btn-def").attr({
							"type"	: "button",
							"value"	: "time"	
						}).text("시간");
						{
							let i_o = $("<i>").attr({
								"data-src"	: "scheduleModify",
								"data-act"	: "clickToggleOrderSort",
							});
							timeBtn_o.append(i_o);
						}
						switchBlockDiv_o.append(timeBtn_o);
						
						// 드레그 정렬 그룹
						let dragSpan_o = $("<span>").addClass("dragBtnGroup square-section").attr("id", "dragBtnGroup" + count);
						{
							// 공익광고 btn
							let publicBtn_o = $("<button>").addClass("btn btn-opt").attr({
								"type"	: "button",
								"value"	: "public"	
							}).text("공익 광고");
							{
								let i_o = $("<i>").attr({
									"data-src"	: "scheduleModify",
									"data-act"	: "clickToggleOrderSort",
								});
								publicBtn_o.append(i_o);
							}
							dragSpan_o.append(publicBtn_o);
							
							// 디폴트 btn
							let defaultBtn_o = $("<button>").addClass("btn btn-opt").attr({
								"type"	: "button",
								"value"	: "default"
							}).text("디폴트");
							{
								let i_o = $("<i>").attr({
									"data-src"	: "scheduleModify",
									"data-act"	: "clickToggleOrderSort",
								});
								defaultBtn_o.append(i_o);
							}
							dragSpan_o.append(defaultBtn_o);
							
							// CPM btn
							let cpmBtn_o = $("<button>").addClass("btn btn-opt").attr({
								"type"	: "button",
								"value"	: "CPM"	
							}).text("CPM");
							{
								let i_o = $("<i>").attr({
									"data-src"	: "scheduleModify",
									"data-act"	: "clickToggleOrderSort",
								});
								cpmBtn_o.append(i_o);
							}
							dragSpan_o.append(cpmBtn_o);
						}
						switchBlockDiv_o.append(dragSpan_o);
					}
				}
			}
			{
				// remove btn
				let removeBtn_o = $("<button>").addClass("slotDel").attr({
					"type": "button",
					"data-src": "scheduleModify",
					"data-act": "clickRemoveSlot",
				}).text("x");
				li_o.append(removeBtn_o);
			}
			slotList_o.append(li_o);
		}
		return li_o;
	}
	
	// 슬롯 개수 재 카운트 
	function _slotReCount() {
		$("#slotList").find("li").each(function(i,o) {
			$(o).find(".slotNum").text(i + 1);
		});
	}
	
	// 드레그로 순서변경을 위한 sortable 생성
	function _createSortable() {
		let el = $("#dragBtnGroup" + _slotIdx)[0];

		new Sortable(el, {
			swapThreshold: 1,
	        invertSwap: true,
	        animation: 150
	    });
	}
	
	// 선택 상품 그리기
	function _drawApplyProduct(data) {
		let productList_o = $("#applyProductList");
		
		if(!data.company_name || !data.category_name || !data.product_name) {
			return false;
		}
		
		let productName = data.company_name + " > " + data.category_name + " > " + data.product_name;
		{
			let li_o = $("<li>").attr("data-product-id", data.product_id);
			{
				// 상품 이름
				let productSpan_o = $("<span>").text(productName);
				li_o.append(productSpan_o);
				
				let div_o = $("<div>");
				li_o.append(div_o);
				{
					// schedule_product_id가 있으면 기존에 등록된 상품
					if(data.schedule_product_id) {
						li_o.attr("data-schedule-product-id", data.schedule_product_id);
						li_o.attr("data-matching-cnt" , data.cpp_matching_cnt);

						// CPP 정보
						let cppInfo = "CPP : (" + data.cpp_matching_cnt + " / " + data.cpp_slot_count + ")";
						let cppSpan_o = $("<span>").addClass("mr-3").text(cppInfo);
						div_o.append(cppSpan_o);
						
						// 편성표 분리
						let a_o = $("<a>").attr("href", "/campaign/schedule/add?product_id=" + data.product_id).text("편성표 분리");
						div_o.append(a_o);
					}
					// 삭제 버튼
					let removeSpan_o = $("<span>").addClass("slotDel").attr({
						"data-src" 			: "scheduleModify",
						"data-act" 			: "clickRemoveProduct",
					}).text("x");
					
					div_o.append(removeSpan_o);
				}
			}
			productList_o.append(li_o);
		}
		_evInit();
	}
	
	// 셀렉트박스 초기화
	function _initSelectBox() {
		$("select").each(function(i, o) {
			$(o).selectpicker("destroy");
			$(o).selectpicker();
		});
	}
	
	// 셀렉트 박스 옵션 제거
	function _removeSelectBoxOption(id, value) {
		$("#" + id).find("[value=" + value + "]").remove();
		_initSelectBox();
	}
	
	// 매체, 분류, 상품 필터링 추가
	// 분류에 대한 모든 상품이 필터링 되었으면 해당 분류 필터링
	// 매체에 대한 모든 분류가 필터링 되었으면 해당 매체 필터링
	function _addSelectBoxFilter(productId) {
		_productFilterList.push(Number(productId));
		
		let isCategoryAllFilter = true;
		let isProductAllFlter = true;
		
		for(let supply of _productList) {
			isCategoryAllFilter = true;
			
			for(let category of supply.category_list) {
				isProductAllFlter = true;

				for(let product of category.product_list) {
					if(!_productFilterList.includes(product.product_id)) {
						isProductAllFlter = false;
						break;
					} 
				}
				
				if(!_categoryFilterList.includes(category.category_id) && isProductAllFlter) {
					_categoryFilterList.push(Number(category.category_id));
					_data.setCategorySelectBox();
				}
				
				if(!_categoryFilterList.includes(category.category_id)) {
					isCategoryAllFilter = false;
				}
			}
			
			if(!_supplyFilterList.includes(supply.member_id) && isCategoryAllFilter) {
				_supplyFilterList.push(Number(supply.member_id));
				_data.setSupplySelectBox();
			}
		}
	}
	
	// 매체, 분류, 상품 셀렉트박스 필터링 제거
	function _removeSelectBoxFilter(productId) {
		// 추가 상품 목록에 추가
		_addProductIdList = _addProductIdList.filter((id) => id != Number(productId));
		
		// 삭제한 상품의 상위 분류
		let categoryId;
		
		// 분류의 상위 매체 
		let memberId;
		
		for(let supply of _productList) {
			for(let category of supply.category_list) {
				for(let product of category.product_list) {
					if(product.product_id == productId) {
						categoryId = category.category_id;
						memberId = supply.member_id;
					}
				}
			}
		}
		
		// 선택한 상품 필터링 제거
		if(_productFilterList.includes(Number(productId))) {
			_productFilterList = _productFilterList.filter(id => id != Number(productId));
			_data.setProductSelectBox();
			
		}

		// 분류 필터링 제거
		if(_categoryFilterList.includes(Number(categoryId))) {
			_categoryFilterList = _categoryFilterList.filter(id => id != Number(categoryId));
			_data.setCategorySelectBox();
			
		}
		
		// 매체 필터링 제거
		if(_supplyFilterList.includes(Number(memberId))) {
			_supplyFilterList = _supplyFilterList.filter(id => id != Number(memberId));
			_data.setSupplySelectBox();
		}
	}
	
	// 등록 데이터 유효성 검사
	function _validateSubmitData(data) {
		let msg = "";
		
		if(!data.schedule_name) {
			msg = "편성표 이름을 입력해주세요.";
		} else {
			// 하나의 디폴트 광고 유무  
			let hasDefault = false;
			
			// 슬롯마다 최소 하나의 옵션이 켜져있는지 유무
			let hasOption = false;
			
			// 편성표에 최소 하나의 디폴트 광고가 있는지 체크
			if(data.slot_list) {
				$.each(data.slot_list, function(i, slot){
					
					let slotType = slot.slot_type;
					if(slotType == "B") {
						hasOption = false;
						
						$.each(slot.sort_info, function(i, info) {
							if(info.sort_type == "default" && info.use_yn == "Y") {
								hasDefault = true;
							}
							
							if(info.use_yn == "Y") {
								hasOption = true;
							}
						});
						
						if(!hasOption) {
							return false;
						}
					}
				});
			}

			if(!hasOption) {
				msg = "Block 슬롯에는 1개 이상의 활성화된 광고가 필요합니다."; 
			} else if(!hasDefault) {
				msg = "편성표에는 최소 1개 이상의 디폴트 광고가 필요합니다.";
			}
		}
		if(msg) {
			customModal.alert({
				content: msg,
			});
			return false;
		}
		return true;
	}
	
	return {
		init
	}
	
})();