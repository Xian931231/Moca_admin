const supplyProductList = (function () {
	
	// 해당 페이지 초기화 함수
	function init(){
		_setDate();
		_setCode();
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
			if(act_v == "clickSearch") {
				_list.getList();
			} else if(act_v == "clickManage") {
				event.clickManage();
			} else if(act_v == "clickAddCategoryBtn") {
				event.clickAddCategoryBtn();
			} else if(act_v == "clickAddCategory") {
				event.clickAddCategory();
			} else if(act_v == "clickRemoveCategory") {
				event.clickRemoveCategory();
			} else if(act_v == "clickCategory") {
				event.clickCategory(evo);
			} else if(act_v == "clickAddProduct") {
				event.clickAddProduct();
			} else if(act_v =="addProduct") {
				event.addProduct();
			} else if(act_v == "clickAllCategory") {
				event.clickAllCategory(evo);
			} else if(act_v == "clickCategorySearch") {
				_list.getCategoryCodeList();
			} else if(act_v == "clickCategorySelect") {
				event.clickCategorySelect(evo);
			} else if(act_v == "clickProductManage") {
				event.clickProductManage(evo);
			} else if(act_v == "clickProductRemove") {
				event.clickProductRemove();
			} else if(act_v == "clickProductModify") {
				event.clickProductModify();
			} else if(act_v == "clickProductSpecSave") {
				event.clickProductSpecSave();
			} else if(act_v == "clickId") {
				event.clickId(evo);
			} else if(act_v == "clickSchedule") {
				event.clickSchedule(evo);
			} else if(act_v == "clickIconDefault") {
				event.resetIcon();
			} else if(act_v == "clickIconFile") {
				event.clickIconFile();
			} else if(act_v == "clickIconManage") {
				event.clickIconManage();
			} else if(act_v == "clickIconModify") {
				event.clickIconModify();
			} else if(act_v == "clickProductSaleStart") {
				event.clickProductSaleStart();
			}
		} else if(type_v == "change") {
			if(act_v == "changeCompany") {
				_list.getCategoryList(evo);
			} else if(act_v == "changeFile") {
				event.changeFile(evo);
			} else if(act_v == "changeIconFile") {
				event.changeIconFile(evo);
			} else if(act_v == "changeAllCheckbox") {
				util.setCheckBox(evo);
			} else if(act_v == "changePrice") {
				event.changePrice();
			} else if(act_v == "changeRate") {
				event.changeRate();
			}
		} else if(type_v == "keyup") {
			if(act_v == "inputSearch") {
				if(ev.keyCode === 13) {
					_list.getList();
				}
			} else if(act_v == "inputCategorySearch") {
				if(ev.keyCode === 13) {
					_list.getCategoryCodeList();
				}
			}
		}
	}
	
	// datepicker 셋팅
	function _setDate() {
		let date = new Date();

		let option = {
	        startDate: date,
		}

		customDatePicker.init("startYmd").datepicker("setDate", moment().subtract(7, "days").toDate());
		customDatePicker.init("endYmd").datepicker("setDate", moment().toDate());
		customDatePicker.init("startDate",  option);
		customDatePicker.init("endDate",  option);
	}
	
	// 상품 사양 selectpicker 셋팅
	function _setCode() {
		_list.drawScreenRate();
		_list.drawScreenSize();
		_list.drawDeviceOs();
	}
	
	// 이벤트
	let _event = {
		// 분류/상품 관리 클릭
		clickManage: function() {
			let url_v = "/member/supply/list";
			
			let data_v = {
				"utype": "S"
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					_list.drawCompanyList(resp.list);
					_list.getCategoryList();
					$("#categoryListModal").modal("show");
				}
			});
		},
		
		// 분류 추가
		clickAddCategory: function() {
			$("#addCompanyList").selectpicker("refresh");
			let memberId = $("#addCompanyList option:selected").val();
			let categoryName = $("#categoryNameInput").val();
			let iconType = $("input[name=addCategoryIconSelect]:checked").val();
			let iconFile = $("#addIconFileSelect")[0].files[0];
			
			let url_v = "/product/category/add";
			
			let data_v = {
				"member_id": memberId,
				"category_name": categoryName,
				"icon_type": iconType
			}
			
			for(let data in data_v) {
				if(memberId == "supply" || util.valNullChk(data_v[data])) {
					customModal.alert({
						content: "미입력된 사항이 있습니다.<br>다시 확인해주세요.",
					});
					return;
				}
			}
			
			if(iconType == "D"){
				data_v.icon_image = $("input[name=addCategoryIcon]:checked").val();
			} else {
				data_v.icon_image = iconFile;
			}
			
			if(util.valNullChk(data_v.icon_image)) {
				customModal.alert({
					content: "파일이 선택되지 않았습니다. 다시 확인해 주세요."
				});
			}
			
			// 파일 검사 
			this.checkIconFile(data_v).then(() => {
				comm.sendFile(url_v, util.getFormData(data_v), "POST", function(resp) {
					if(resp) {
						_list.getList();
						_list.getCategoryList();
						$("#addCategoryModal").modal("hide");
					}
				});
			}).catch((errorType) => {
				this.fileCheckAlert(errorType);
				return;
			})
		},
		
		// 분류 삭제
		clickRemoveCategory: function() {
			let categoryList = [];
			
			$("input[name=categoryChk]:checked").each(function() {
				categoryList.push(Number($(this).val()));
			});	
			
			let url_v = "/product/category/remove";
			
			let data_v = {
				"ssp_category_id_list": categoryList
			}

			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					if(resp.code == 8004) {
						customModal.alert({
							content: "상품이 생성된 분류는 삭제할 수 없습니다."
						});
					} else {
						_list.getList();
						_list.getCategoryList();
					}
				}
			});
		},
		
		// 분류명 클릭 > 상품관리 모달
		clickCategory: function(evo) {
			let tr_o = evo.parents("tr");
			_list.getCategoryDetail(tr_o.attr("data-category-id"));
		},
		
		// 상품 추가 클릭
		clickAddProduct: function() {
			$("#productName").val("");
			$("#productRate").val("");
			$("#productPricePay").val("");
			$("#startDate").val("");
			$("#endDate").val("");
			$("#denyCategoryCode").val("");
			$("#productNotes").val("");
		
			$("#addProductModal").modal("show");	
		},
		
		// 상품 추가
		addProduct: function() {
			// null 체크
			let productName = $("#productName").val();
			let productRate = $("#productRate").val();
			let startDate = $("#startDate").val();
			let endDate = $("#endDate").val();
			
			if(startDate > endDate) {
				customModal.alert({
					content: "시작일이 종료일 이후일 수 없습니다."
				});
				return;
			}
			
			if(util.valNullChk(productName) || util.valNullChk(productRate) || util.valNullChk(startDate) || util.valNullChk(endDate)) {
				customModal.alert({
					content: "입력되지 않은 항목이 있습니다."
				});
			} else {
				let url_v = "/product/add";
				
				let data_v = {
					"category_id": Number($("#productListName").attr("data-category-id")),
					"product_name": String(productName),
					"price_rate": productRate,
					"start_ymd": startDate,
					"end_ymd": endDate,
				}
				
				let denyCategory_o = $("#denyCategoryCode");
				let denyMain = denyCategory_o.attr("data-main-code");
				let denyMiddle = denyCategory_o.attr("data-middle-code");
				let denySub = denyCategory_o.attr("data-sub-code");
				
				if(!util.valNullChk(denyMain) && !util.valNullChk(denyMiddle) && !util.valNullChk(denySub)) {
					data_v.deny_category_code1 = denyMain;
					data_v.deny_category_code2 = denyMiddle;
					data_v.deny_category_code3 = denySub;
				}
				
				if(!util.valNullChk($("#productNotes").val())) {
					data_v.notes = $("#productNotes").val();
				}
				
				comm.send(url_v, data_v, "POST", function(resp) {
					if(resp) {
						_list.getList();
						_list.getProductList();
						$("#addProductModal").modal("hide");
					}
				});
			}
		},
		
		// 전체 카테고리 클릭
		clickAllCategory: function(evo) {
			let input_o = evo.parents("input");
			input_o.attr({
				"data-main-code": "",
				"data-middle-code": "",
				"data-sub-code": "",
			});
			
			$("#categorySearch").attr({
				"data-type": evo.attr("data-type"),
			}).val("");

			_list.getCategoryCodeList();
			$("#allCategoryList").modal("show");
		},
		
		// 카테고리 선택
		clickCategorySelect: function(evo) {
			let type = $("#categorySearch").attr("data-type");
			let tr_o = evo.parents("tr");
			
			let denyCategory_o = (type == "add") ? $("#denyCategoryCode") : $("#modifyProductDenyCategory"); 
			
			denyCategory_o.attr({
				"data-main-code": tr_o.attr("data-main-code"),
				"data-middle-code": tr_o.attr("data-middle-code"),
				"data-sub-code": tr_o.attr("data-sub-code"),
			});
			
			let denyCategory_v = tr_o.attr("data-main-name") + " > " + tr_o.attr("data-middle-name") + " > " + tr_o.attr("data-sub-name");

			denyCategory_o.val(denyCategory_v);
			$("#allCategoryList").modal("hide");
		},
		
		// 상품 관리 클릭
		clickProductManage: function(evo) {
			let tr_o = evo.parents("tr");
			
			$("#productSpecName").attr({"data-product-id": tr_o.attr("data-product-id")});

			_list.getProductSpec();
			$("#productSpecModal").modal("show");
		},
		
		// 상품 삭제 클릭
		clickProductRemove: function() {
			if($("#productSpecName").attr("data-product-spec") == 1) {
				customModal.confirm({
					content: "상품에 등록된 사양, 디바이스도 함께 삭제됩니다.<br>삭제하시겠습니까?",
					confirmText: "삭제",
					confirmCallback: function() {
						_event.productRemove();
					}					
				});
			} else {
				_event.productRemove();
			}
		},
		
		// 상품 삭제
		productRemove: function() {
			let url_v = "/product/remove";
						
			let data_v = {
				"ssp_product_id": $("#productSpecName").attr("data-product-id")
			}
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					if(resp.code) {
						customModal.alert({
							content: "광고가 진행중인 상품은 삭제하실 수 없습니다."
						});
						return;
					}
					_list.getProductList();
					$("#productSpecModal").modal("hide");
					$("#productModifyModal").modal("hide");
				}
			});			
		},
		
		// 상품 수정 클릭
		clickProductModify: function() {
			_list.getProductSpec();
			$("#productModifyModal").modal("show");
		},
		
		// 상품 사양 수정 저장
		clickProductSpecSave: function() {
			$("#modifyProductScreenRate").selectpicker("refresh");
			$("#modifyProductScreenSize").selectpicker("refresh");
			
			let startDate = $("#salesStart").val();
			let endDate = $("#salesEnd").val();
			
			if(startDate > endDate) {
				customModal.alert({
					content: "시작일이 종료일 이후일 수 없습니다."
				});
				return;
			}
			
			let formatList = [];
			$("input[name=modifyProductFormat]:checked").each(function() {
				formatList.push(($(this).val()));
			});	
			
			let url_v = "/product/modify";
			
			let data_v = {
				"ssp_product_id": $("#productSpecName").attr("data-product-id"),
				"product_name": $("#modifyProductName").val(),
				"price_rate": $("#modifyProductRate").val(),
				"start_ymd": startDate,
				"end_ymd": endDate,
				"product_os": $("#modifyProductOs option:selected").val(),
				"support_format": formatList,
				"screen_rate": $("#modifyProductScreenRate option:selected").val(),
				"screen_resolution": $("#modifyProductScreenSize option:selected").val(),
				"screen_size": $("#modifyProductSize").val(),
				"storage": $("#modifyProductStorage").val(),
				"install_position": $("input[name=modifyProductPosition]:checked").val(),
				"install_direction": $("input[name=modifyProductDirection]:checked").val(),
				"support_audio": $("input[name=modifyProductAudio]:checked").val(),
			};
			
			// null 체크
			for(let data in data_v) {
				if(util.valNullChk(data_v[data]) || util.valNullChk($("#modifyProductImageDiv").children("img").attr("src"))) {
					customModal.alert({
						content: "입력되지 않은 항목이 있습니다.<br/>모든 정보를 입력해주세요.",
					});
					return;
				}
			}
			
			// 거부 카테고리 유무 확인
			let denyCateogry_o = $("#modifyProductDenyCategory");
			if(!util.valNullChk(denyCateogry_o.val())) {
				data_v.deny_category_code1 = denyCateogry_o.attr("data-main-code");
				data_v.deny_category_code2 = denyCateogry_o.attr("data-middle-code");
				data_v.deny_category_code3 = denyCateogry_o.attr("data-sub-code");
			}
			
			if(!util.valNullChk($("#modifyProductNotes").val())) {
				data_v.notes = $("#modifyProductNotes").val();
			}
			
			if(!util.valNullChk($("#modifyProductImage")[0].files[0])) {
				data_v.product_file = $("#modifyProductImage")[0].files[0];
			}

			comm.sendFile(url_v, util.getFormData(data_v), "POST", function(resp) {
				if(resp.result == true) {
					_list.getList();
					_list.getProductList();
					_list.getProductSpec();
					$("#productModifyModal").modal("hide");
				} else {
					if(resp.code == "8007") {
						customModal.alert({
							content: "광고가 진행중인 상품은 수정하실 수 없습니다."
						});
						
						return;
					}
				}
			});
		},
		
		// 매체사 로그인
		clickId: function(evo) {
			let memberId = evo.attr("data-member-id");
			let memberUid = evo.attr("data-member-uid");
			let memberUtype = evo.attr("data-member-utype");
			util.staffLogin({
				memberId, 
				memberUid,
				memberUtype,
			});
		},
		
		// 스케줄 클릭
		clickSchedule: function(evo) {
			location.href = "/campaign/schedule/modify?schedule_id=" + evo.attr("data-schedule-id");
		},
		
		// 분류 추가 버튼 클릭
		clickAddCategoryBtn: function() {
			this.resetIcon();
			$("#addCompanyList").val($("#companyList").val()).selectpicker("refresh");
			$("#categoryNameInput").val("");
			$("#addCategoryModal").modal("show");	
		},
		
		// 새아이콘 클릭
		clickIconFile: function() {
			$(".selectRadio-icon1").addClass("icon-hide");
			$(".selectRadio-icon1").css({"display": "none"});
			$(".selectRadio-icon2").removeClass("icon-hide");
			$(".selectRadio-icon2").css({"display": "block"});	
		},
		
		// 아이콘 관리 클릭
		clickIconManage: function() {
			this.resetIcon(); 
			$("#iconManageModal").modal("show");
		},
		
		// 아이콘 수정 클릭
		clickIconModify: function() {
			customModal.confirm({
				content: "기존 아이콘이 삭제되고 현재 선택된 아이콘으로 수정됩니다.",
				confirmCallback: () => { this.iconModifyProcess() },
				cancelCallback: () => { return; }
			});
		},
		
		// 아이콘 수정
		iconModifyProcess: function() {
			let categoryId = $("#categoryIcon").attr("data-category-id");
			let iconType = $("input[name=modifyCategoryIconSelect]:checked").val();
			
			let url_v = "/product/category/modify/icon";
			
			let data_v = {
				"ssp_category_id": categoryId,
				"icon_type": iconType
			};
			
			for(let data in data_v) {
				if(util.valNullChk(data_v[data])) {
					customModal.alert({
						content: "미입력된 사항이 있습니다.<br>다시 확인해주세요.",
					});
					return;
				}
			}
			
			if(iconType == "D"){
				data_v.icon_image = $("input[name=modifyCategoryIcon]:checked").val();
			} else {
				data_v.icon_image = $("#modifyIconFileSelect")[0].files[0];
			}
			
			if(util.valNullChk(data_v.icon_image)) {
				customModal.alert({
					content: "파일이 선택되지 않았습니다. 다시 확인해 주세요."
				});
			}
			
			// 파일 검사 
			this.checkIconFile(data_v).then(() => {
				comm.sendFile(url_v, util.getFormData(data_v), "POST", function(resp) {
					if(resp) {
						customModal.alert({
							content: "아이콘이 수정되었습니다."
						});
						_list.getCategoryDetail(categoryId);
					}
				});
			}).catch((errorType) => {
				this.fileCheckAlert(errorType);
				return;
			})	
		},
		
		// 상품 판매 시작 버튼 클릭
		clickProductSaleStart: function() {
			let url_v = "/product/sale/start";
		
			let data_v = {
				"ssp_product_id": $("#productSpecName").attr("data-product-id")
			}				 
		
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result == true) {
					customModal.alert({
						content: "판매를 시작하고 상품이 리스트에 노출됩니다.",
						confirmCallback: function() {
							_list.getList();
							$("#productSpecModal").modal("hide");
						}
					});
				} else {
					 let content = "";
				 
					 if(resp.code == "8008") {
						 content = "미입력 된 사양이 있습니다.";
					 } else if(resp.code == "8009") {
						 content = "기기가 등록되지 않았습니다.";
					 }
					 
					 customModal.alert({
						content: content 
					 });
					
					return;
				}
			});
		},
		
		// 파일 변경
		changeFile: function(evo) {
			$("#modifyProductImageDiv").empty();
			
			let fileName = $(evo).val().split("\\").pop();
			$("#modifyProductImage").siblings("label").html(fileName);

			let file = $("#modifyProductImage")[0].files[0];
			
			if(file) {
				let reader = new FileReader();
			    reader.onload = function(e) {
					let image_o = $("<img>").attr({
						"src": e.target.result
					});
					$("#modifyProductImageDiv").append(image_o);					
			    };
			    reader.readAsDataURL(file);
			} else {
				$("#modifyProductImageDiv").children("img").remove();
			}
			
		},
		
		// 아이콘 파일 변경
		changeIconFile: function(evo) {
			let fileName = $(evo).val().split("\\").pop();
			$(evo).siblings("label").html(fileName);
			
			// TODO 파일 확장자, 사이즈 체크 후 하단 메세지 
		},
		
		// 가격 변경
		changePrice: function() {
			let rate = $("#productRate").val();
			if(util.valNullChk(rate)) {
				rate = 100;
			}
			
			let totalPay = util.numberWithComma(Math.round(100000 * (rate / 100)));
			
			$("#productPricePay").val(totalPay);	
		},
		
		// 가중치 변경 
		changeRate: function() {
			$("#modifyProductPricePay").html(util.numberWithComma(Math.round(100000 * ($("#modifyProductRate").val() / 100))) + "원");			
		},
		
		// icon selector 디폴트 값으로 초기화
		resetIcon: function() {
			$("input:radio[name=addCategoryIconSelect]:radio[value='D']").prop("checked", true);
			$("input:radio[name=addCategoryIcon]").eq(0).prop("checked", true);
			$("input:radio[name=modifyCategoryIconSelect]:radio[value='D']").prop("checked", true);
			$("input:radio[name=modifyCategoryIcon]").eq(0).prop("checked", true);
			$("input:file").siblings("label").html("");
			$(".selectRadio-icon2").addClass("icon-hide");
			$(".selectRadio-icon2").css({"display": "none"});
			$(".selectRadio-icon1").removeClass("icon-hide");
			$(".selectRadio-icon1").css({"display": ""});
		},
		
		// 아이콘 파일 검사
		checkIconFile: function(data) {
			return new Promise((resolve, reject) => {
				if(data.icon_type == "F") {
					file = data.icon_image;
					fileUtil.getFileInfo(file, function(fileData) {
						let chk = false;
						let errorType = "";
			
						if(fileData.width == 55 && fileData.height == 55) {
							let extList = ["jpg", "jpeg", "png"];
							chk = fileUtil.isUploadableExt(file, extList);
							
							if(chk == false) {
								errorType = "E";
							}
						} else {
							errorType = "S";
						}
						
						if(chk == true) {
							resolve();
						} else {
							reject(errorType);
						}
					});
				} else {
					resolve();
				}
			});
		},
		
		// 파일 유효성 체크 오류 alert
		fileCheckAlert: function(errorType) {
			let content = "";
				
			if(errorType == "S") {
				content = "사이즈가 일치하지 않습니다.";
			} else {
				content = "확장자가 올바르지 않습니다.";
			}
			
			customModal.alert({
				content: content
			});
		},
	}
	
	// 리스트
	let _list = {
		// 매체/상품 리스트 가져오기
		getList: function(curPage = 1) {
			$("#dateType").selectpicker("refresh");
			$("#searchType").selectpicker("refresh");
			
			let startDate = $("#startYmd").val();
			let endDate = $("#endYmd").val();
			
			if(util.getDiffDate(startDate, endDate, "months") >= 3) {
				customModal.alert({
					content: "최대 조회 기간은 3개월입니다."
				});
				return;
			}
			
			if(startDate > endDate) {
				customModal.alert({
					content: "시작일이 종료일 이후일 수 없습니다."
				});
				return;
			}

			let url_v = "/product/all/list";

			let data_v = {
				"start_date": startDate,
				"end_date": endDate,
				"search_yn": "N"
			};
			
			// 검색 조건
			let dateType_v = $("#dateType option:selected").val();
			if(!util.valNullChk(dateType_v)) {
				data_v.date_type = dateType_v;
			}

			let searchValue_v = $("#searchValue").val();
			if(!util.valNullChk(searchValue_v)) {
				data_v.search_value = searchValue_v;
				data_v.search_yn = "Y";
			}
			
			let searchType_v = $("#searchType option:selected").val();
			if(!util.valNullChk(searchType_v)) {
				data_v.search_type = searchType_v;
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
				if(resp) {
					dev.log(resp);
					_list.drawList(resp.list);
					page_o.drawPage(resp.tot_cnt);
					_evInit();
				}
			});
		},
		
		// 매체/상품 리스트 그리기
		drawList: function(list) {
			let supplyTab_o = $("#supplyTabList").empty();
			if(list && list.length > 0) {
				
				for(let supply of list) {
					{	
						// 아코디언 탭
						let button_o = $("<button>").attr({
							"class": "btn btn-block mb-2 text-left accordion-btn",
							"data-toggle": "collapse",
							"data-target": "#tab" + supply.member_id
						});
						supplyTab_o.append(button_o);
						
						{
							// 매체명, 매체id
							let span_o = $("<span>").html(supply.company_name + "(");
							let a_o = $("<a>").attr({
								"href": "javascript:;",
								"data-src": "list",
								"data-act": "clickId",
								"data-member-id": supply.member_id,
								"data-member-uid": supply.uid,
								"data-member-utype": globalConfig.memberType.SUPPLY.utype,
							}).html(supply.uid);
							span_o.append(a_o, ")");
							button_o.append(span_o);
						}
						{
							// 담당자, 정산일
							let span_o = $("<span>");
							let span_name_o = $("<span>").append("담당자 : ", supply.uname, " | ");
							let span_balance_o = $("<span>").append("정산일 : 매달 ", supply.balance_day, "일");
							span_o.append(span_name_o, span_balance_o);
							button_o.append(span_o);
						}
					}
					{
						// 분류/상품 테이블
						let div_o = $("<div>").attr({
							"id": "tab" + supply.member_id,
							"class": "collapse",
							"data-parent": "#supplyTabList"
						});
						supplyTab_o.append(div_o);
						
						let div_table_o = $("<div>").addClass("tableWrap");
						div_o.append(div_table_o);
						
						let div_inner_o = $("<div>").addClass("tableInner management advTable4");
						div_table_o.append(div_inner_o);
						
						let table_o = $("<table>").addClass("table");
						div_inner_o.append(table_o);
						
						let colgroup_o = $("<colgroup>");
						table_o.append(colgroup_o);
	
						let col_1_o = $("<col>").attr({"width": "100px"});
						let col_2_o = $("<col>").attr({"width": "230px"});
						let col_3_o = $("<col>").attr({"width": "120px"});
						let col_4_o = $("<col>").attr({"width": "120px"});
						let col_5_o = $("<col>").attr({"width": "120px"});
						let col_6_o = $("<col>").attr({"width": "120px"});
						let col_7_o = $("<col>").attr({"width": "230px"});
						let col_8_o = $("<col>").attr({"width": "*"});
						colgroup_o.append(col_1_o, col_2_o, col_3_o, col_4_o, col_5_o, col_6_o, col_7_o, col_8_o);
						
						let thead_o = $("<thead>");
						table_o.append(thead_o);
						
						let tr_o = $("<tr>");
						thead_o.append(tr_o);
						
						let th_1_o = $("<th>").html("분류");
						let th_2_o = $("<th>").html("상품명");
						let th_3_o = $("<th>").html("화면규격");
						let th_4_o = $("<th>").html("등록 일자");
						let th_5_o = $("<th>").html("판매 시작일");
						let th_6_o = $("<th>").html("판매 종료일");
						let th_7_o = $("<th>").html("슬롯 수");
						let th_8_o = $("<th>").html("편성표");
						tr_o.append(th_1_o, th_2_o, th_3_o, th_4_o, th_5_o, th_6_o, th_7_o, th_8_o);
						
						let tbody_o = $("<tbody>");
						table_o.append(tbody_o);
						
						if(supply.category_list && supply.category_list.length > 0) {
							for(let category of supply.category_list) {
								for(let i = 0; i < category.product_list.length; i++) {
									let product = category.product_list[i];
									
									let tr_o = $("<tr>");
									tbody_o.append(tr_o);
									
									{
										// 분류
										if(i == 0) {
											let td_o = $("<td>").attr({
												"rowspan": category.product_list.length
											}).html(product.category_name);
											tr_o.append(td_o);
										}	
									}
									{
										// 상품명
										let td_o = $("<td>").html(product.product_name);
										tr_o.append(td_o);
									}
									{
										// 해상도
										let td_o = $("<td>");
										let resolution = product.screen_resolution;
										if(resolution) {
											td_o.html(product.screen_resolution);
										} else {
											td_o.html("-");
										}
										tr_o.append(td_o);
									}
									{
										// 등록일
										let td_o = $("<td>").html(product.insert_date);
										tr_o.append(td_o);
									}
									{
										// 판매시작일
										let td_o = $("<td>");
										if(product.sale_yn == "Y") {
											td_o.html(product.start_ymd);
										} else {
											td_o.html("판매 시작 필요");
											td_o.css({"color": "red"});
										}
										tr_o.append(td_o);
									}
									{
										// 판매종료일
										let td_o = $("<td>");
										if(product.sale_yn == "Y") {
											td_o.html(product.end_ymd);
											
											if(product.imminent) {
												td_o.addClass("deadLine");
											}
										} else {
											td_o.html("");
										}
										tr_o.append(td_o);
									}
									{
										// 슬롯수
										let td_o = $("<td>");
										let total = product.total_slot_cnt;
										let slotText = "";
										if(total) {
											slotText = total + "개 (CPP : " + product.cpp_slot_cnt + " / Block : " + product.cpm_slot_cnt + ")";
										} else {
											slotText = "슬롯 없음";
										}
										td_o.append(slotText);
										tr_o.append(td_o);
									}
									{
										// 편성표
										let td_o = $("<td>");
										let schedule = product.schedule_name;
										if(schedule) {
											let a_o = $("<a>").attr({
												"href": "javascript:;",
												"data-src": "list",
												"data-act": "clickSchedule",
												"data-schedule-id": product.schedule_id
											}).html(product.schedule_name);
											td_o.append(a_o);
										}
										tr_o.append(td_o);
									}
								}
							}
						} else {
							let div_o = $("<div>").addClass("notnotnot").html("상품이 없습니다.");
							div_table_o.prepend(div_o);
	
							let tr_o = $("<tr>");
							tbody_o.append(tr_o);
							
							for(let j = 0; j < 8; j++) {
								let td_o = $("<td>");
								tr_o.append(td_o);
							}
						}
					}
				}
				$("#tableWrap").removeClass("blank");
				$("#supplyTabList").removeClass("notnotnot");
				$("#page").show();
			} else {
				$("#tableWrap").addClass("blank");
				$("#supplyTabList").addClass("notnotnot").html("검색 결과가 없습니다.");
				$("#page").hide();
			}
			_evInit();
		},
		
		// 매체사 리스트
		drawCompanyList: function(list) {
			let select_o = $("select[name=companyList]").empty();
			select_o.append(new Option("매체명", "supply"));
			
			for(item of list) {
				select_o.append(new Option(item.company_name, item.member_id));
			}
			$("select[name=companyList]").selectpicker("refresh");
		},
		
		// 분류 리스트
		getCategoryList: function(evo) {
			if(evo) {
				$("#addCompanyList").val(evo.val());
				$("#addCompanyList").selectpicker("refresh");
			}
			$("#companyList").selectpicker("refresh");
			
			let memberId = $("#companyList option:selected").val();
			if(memberId == "supply") {
				memberId = "";
			}
			
			let url_v = "/product/category/list";
					
			let data_v = {
				"member_id": memberId
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					_list.drawCategoryList(resp.list);
				}
			});
		},
		
		// 분류 리스트 그리기
		drawCategoryList: function(list) {
			let tbody_o = $("#categoryList").empty();
			
			if(list && list.length > 0) {
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-category-id": item.category_id,
					});
					tbody_o.append(tr_o);
					
					{
						// 체크박스
						let td_o = $("<td>");
						let span_o = $("<span>").addClass("chk");
						let input_o = $("<input>").attr({
							"type": "checkbox",
							"name": "categoryChk",
							"class": "chk",
							"id": "chk" + item.category_id
						}).val(item.category_id);
						let label_o = $("<label>").attr({"for": "chk" + item.category_id});
						
						span_o.append(input_o, label_o);
						td_o.append(span_o);
						tr_o.append(td_o);
					}
					{
						// 매체명
						let td_o = $("<td>").html(item.company_name);
						tr_o.append(td_o);
					}
					{
						// 분류명
						let td_o = $("<td>");
						let a_o = $("<a>").attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickCategory",
						}).html(item.category_name);
						td_o.append(a_o);
						tr_o.append(td_o);
					}
					{
						// 상품수
						let td_o = $("<td>").html(item.product_cnt);
						tr_o.append(td_o);
					}
				}
			}
			_evInit();
		},
		
		// 분류 상세 가져오기
		getCategoryDetail: function(categoryId) {
			let url_v = "/product/category/detail";
			
			let data_v = {
				"ssp_category_id": categoryId
			} 
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					let data = resp.data;
					
					// 상품 관리 모달 제목
					$("#productListName").attr({
						"data-category-id": categoryId
					}).html(data.company_name + " - " + data.category_name);
					
					// 설정 아이콘
					$("#categoryIcon").empty();
					let icon = data.icon_image;
					if(icon.indexOf("/assets") == -1) {
						icon = globalConfig.getS3Url() + icon;
					}
					let img_o = $("<img>").attr({
						"src": icon
					});
					$("#categoryIcon").append(img_o).attr({"data-category-id": data.ssp_category_id});
					
					_list.getProductList();
				}
			});
		},
		
		// 상품 리스트 가져오기
		getProductList: function() {
			let url_v = "/product/list";
			
			let data_v = {
				"ssp_category_id": $("#productListName").attr("data-category-id")
			}
			
			comm.send(url_v, data_v, "POST", function(resp) {
				dev.log(resp);
				if(resp) {
					_list.drawProductList(resp.list);
				}
			});
		},
		
		// 상품 리스트 그리기
		drawProductList: function(list) {
			let tbody_o = $("#productList").empty();
			
			if(list && list.length > 0) {
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-product-id": item.product_id
					});
					tbody_o.append(tr_o);
					
					{
						// 상품명
						let td_o = $("<td>").html(item.product_name);
						tr_o.append(td_o);
					}
					{
						// 사양 등록일
						let td_o = $("<td>");
						if(util.valNullChk(item.update_date)) {
							td_o.html("-");
						} else {
							td_o.html(item.update_date);
						}
						tr_o.append(td_o);
					}
					{
						// 관리버튼
						let td_o = $("<td>");
						tr_o.append(td_o);
						
						let button_o = $("<button>").attr({
							"type": "button",
							"class": "btn btn-approved",
							"data-src": "list",
							"data-act": "clickProductManage",			
						}).html("관리");
						td_o.append(button_o);
					}
				}
			}
			_evInit();
			
			// 모달 변경
			$("#categoryListModal").modal("hide");
			$("#productListModal").modal("show");
		},
		
		// 카테고리 가져오기
		getCategoryCodeList: function() {
			let url_v = "/common/code/sg/list";
			
			let data_v = {
				"code_name": $("#categorySearch").val()
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				dev.log(resp);
				if(resp) {
					_list.drawCategoryCodeList(resp.list);
				}
			})
		},
		
		// 카테고리 그리기
		drawCategoryCodeList: function(list) {
			let tbody_o = $("#categoryCodeList").empty();
			
			if(list && list.length > 0) {
				for(let item of list) {
					let tr_o = $("<tr>").attr({
						"data-main-code": item.main_category,
						"data-main-name": item.main_category_name,
						"data-middle-code": item.middle_category,
						"data-middle-name": item.middle_category_name,
						"data-sub-code": item.sub_category,
						"data-sub-name": item.sub_category_name,
					});
					tbody_o.append(tr_o);
					
					{
						// 대분류
						let td_o = $("<td>").html(item.main_category_name);
						tr_o.append(td_o);
						
					}
					{
						// 중분류
						let td_o = $("<td>");
						if(item.middle_category_name) {
							td_o.html(item.middle_category_name);
						}
						tr_o.append(td_o);
					}
					{
						// 소분류
						let td_o = $("<td>");
						if(item.sub_category_name) {
							td_o.html(item.sub_category_name);
						}
						tr_o.append(td_o);
					}
					{
						// 선택
						let td_o = $("<td>");
						tr_o.append(td_o);
						
						let a_o = $("<a>").attr({
							"href": "javascript:;",
							"data-src": "list",
							"data-act": "clickCategorySelect"
						}).html("선택");
						td_o.append(a_o);
					}
				}
			}
			_evInit();
		},
		
		// 상품 사양 가져오기
		getProductSpec: function() {
			let url_v = "/product/detail";
			
			let data_v = {
				"ssp_product_id": $("#productSpecName").attr("data-product-id")
			}

			comm.send(url_v, data_v, "POST", function(resp) {
				dev.log(resp);
				if(resp.data) {
					_list.drawProductSpec(resp.data);
				}			
			});
		},
		
		// 상품 사양 상세 모달 > 상품 기본 정보 그리기
		drawProductSpec: function(item) {
			// 사양 상세 초기화
			$("#productSpecImg").empty();
			$("#productSpecOs").html("");
			$("#productSpecFormat").html("");
			$("#productSpecScreenRate").html("");
			$("#productSpecResolution").html("");
			$("#productSpecScreenSize").html("");
			$("#productSpecSize").html("");
			$("#productSpecPosition").html("");
			$("#productSpecDirection").html("");
			$("#productSpecAudio").html("");
			$("#productSpecNotes").html("");
			
			// 수정 초기화
			$("#modifyProductImageDiv").empty();
			$("#modifyProductDenyCategory").val("");
			$("#modifyProductLabel").html("");
			$("#modifyProductSize").val("");
			$("#modifyProductStorage").val("");
			$("input[name=modifyProductFormat]").prop("checked", false);
			$("input[name=modifyProductPosition][value='I']").prop("checked", true);
			$("input[name=modifyProductDirection][value='H']").prop("checked", true);
			$("input[name=modifyProductAudio][value='Y']").prop("checked", true);
			$("#modifyProductScreenRate option:eq(0)").prop("selected", true);
			$("#modifyProductScreenSize option:eq(0)").prop("selected", true);
			$("#modifyProductOs option:eq(0)").prop("selected", true);
			
			// 상세 기본 정보		
			$("#productSpecName").attr({"data-product-spec": 0}).html(item.product_name);
			$("#productSpecPrice").html(util.numberWithComma(100000) + " 원");
			$("#productSpecRate").html(item.price_rate + " %");
			$("#productSpecPricePay").html(util.numberWithComma(item.price_pay) + " 원");
			$("#productSpecStartDate").html(item.start_ymd)
			$("#productSpecEndDate").html(item.end_ymd)
			if(item.deny_category_sub) {
				$("#productSpecDenyCategory").html(item.deny_category_main + " > " + item.deny_category_middle + " > " + item.deny_category_sub);
			} else {
				$("#productSpecDenyCategory").html("");
			}
			if(item.notes) {
				$("#productSpecNotes").html(item.notes);
			}
			
			// 수정 기본 정보
			$("#modifyProductName").val(util.unescapeData(item.product_name));
			$("#modifyProductPrice").val("100,000");
			$("#modifyProductRate").val(item.price_rate);
			$("#modifyProductPricePay").html(util.numberWithComma(item.price_pay) + "원");
			$("#salesStart").val(item.start_ymd);
			$("#salesEnd").val(item.end_ymd);
			if(item.deny_category_sub) {
				$("#modifyProductDenyCategory").val(item.deny_category_main + " > " + item.deny_category_middle + " > " + item.deny_category_sub).attr({
					"data-main-code": item.deny_category_code1,
					"data-middle-code": item.deny_category_code2,
					"data-sub-code": item.deny_category_code3,
				});
			} else {
				$("#modifyProductDenyCategory").val("");
			}
			$("#modifyProductNotes").val(util.unescapeData(item.notes));
			
			customDatePicker.init("salesStart");
			customDatePicker.init("salesEnd"); 
			
			if(item.status == "S") {
				// 상세 사양 정보
				$("#productSpecName").attr({"data-product-spec": 1});
				let div_o = $("#productSpecImg");
				let img_o = $("<img>").attr({
					"src": globalConfig.getS3Url() + item.product_image
				});
				div_o.append(img_o);
				
				$("#productSpecOs").html(item.os_name);
				$("#productSpecFormat").html(item.support_format);
				$("#productSpecScreenRate").html(item.screen_rate);
				$("#productSpecResolution").html(item.screen_resolution);
				$("#productSpecScreenSize").html(item.screen_size + " inch");
				$("#productSpecSize").html(item.storage + " GB");
				
				let position = item.install_position;
				let positionText = "";
				if(position == "I") {
					positionText = "실내";
				} else {
					positionText = "실외";
				}
				$("#productSpecPosition").html(positionText);
				
				let direction = item.install_direction;
				let directionText = "";
				if(direction == "H") {
					directionText = "가로";
				} else {
					directionText = "세로";
				}
				$("#productSpecDirection").html(directionText);
				
				let audio = item.support_audio;
				let audioText = "";
				if(audio == "Y") {
					audioText = "유";
				} else {
					audioText = "무";
				}
				$("#productSpecAudio").html(audioText);
				
				// 수정 사양 상세 정보
				let formatList = item.support_format.split(",");
				for(let format of formatList) {
					$("input[name=modifyProductFormat][value='" + format + "']").prop("checked", true);
				}
				let image_o = $("<img>").attr({
					"src": globalConfig.getS3Url() + item.product_image
				});
				$("#modifyProductImageDiv").append(image_o);
				$("#modifyProductSize").val(item.screen_size);
				$("#modifyProductStorage").val(item.storage);
				$("input[name=modifyProductPosition][value='" + position + "']").prop("checked", true);
				$("input[name=modifyProductDirection][value='" + direction + "']").prop("checked", true);
				$("input[name=modifyProductAudio][value='" + audio + "']").prop("checked", true);
				
				$("#modifyProductScreenRate").val(item.screen_rate);
				$("#modifyProductScreenSize").val(item.screen_resolution);
				$("#modifyProductOs").val(item.os);
			}
			
			$("#modifyProductScreenRate").selectpicker("refresh");
			$("#modifyProductScreenSize").selectpicker("refresh");
			$("#modifyProductOs").selectpicker("refresh");
		},
		
		// 화면 비율 셀렉트
		drawScreenRate: function() {
			let url_v = "/common/code/list";
		
			let data_v = {
				"parent_code": "SCREEN_RATE"
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					let select_o = $("#modifyProductScreenRate");
					
					_list.drawSelect(resp.list, select_o);
				}
			});
		},
		
		// 화면 사이즈 셀렉트
		drawScreenSize: function() {
			let url_v = "/common/code/list";
		
			let data_v = {
				"parent_code": "PAGE_SIZE"
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					let select_o = $("#modifyProductScreenSize");
					
					_list.drawSelect(resp.list, select_o);
				}
			});
		},
		
		// 디바이스 OS 셀렉트
		drawDeviceOs: function() {
			let url_v = "/common/code/device/list";
		
			let data_v = {};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp) {
					let select_o = $("#modifyProductOs");
					
					_list.drawSelect(resp.list, select_o);
				}
			});
		},
		
		// selectpicker 그리기
		drawSelect: function(list, select_o) {
			if(list && list.length > 0) {
				for(let i = 0; i < list.length; i++) {
					let item = list[i];
					if(i == 0) {
						select_o.append(new Option(item.code_name, item.code, true, true));
					} else {
						select_o.append(new Option(item.code_name, item.code));
					}
				}
				select_o.selectpicker("refresh");
			}
		},
	}

	return {
		init,
	}
	
})();