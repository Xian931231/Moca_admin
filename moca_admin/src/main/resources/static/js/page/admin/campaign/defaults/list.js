/**
 * 광고 관리 > 디폴트 광고 관리
 */
const defaultList = (function() {
	
	let pageSizeCodes = [
		{
			id: "ratioList1",
			code: "1920x1080",
		},
		{
			id: "ratioList2",
			code: "1600x1200",
		},
		{
			id: "ratioList3",
			code: "2560x1080",
		},
		{
			id: "ratioList4",
			code: "1080x1920",
		},
		{
			id: "ratioList5",
			code: "1200x1600",
		},
		{
			id: "ratioList6",
			code: "1080x2560",
		},
		{
			id: "ratioList7",
			code: "1080x1080",
		},
	];
	
	// 해당 페이지 초기화 함수
	function init() {
		_list.getList();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='list'][data-act]").off();
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
		
		if(type_v == "click") {
			if(act_v == "clickMaterialPop") {
				event.clickMaterialPop(evo);
			} else if(act_v == "clickMaterialAdd") {
				event.clickMaterialAdd();
			} else if(act_v == "clickMaterialRemove") {
				event.clickMaterialRemove(evo);
			} else if(act_v == "clickSg") {
				event.clickSg(evo);
			} else if(act_v == "clickPopClose") {
				event.clickPopClose();
			}
		} else if(type_v == "change") {
			if(act_v == "changeMaterialFile") {
				event.changeMaterialFile(evo);
			} else if(act_v == "changeTableCheck") {
				util.setCheckBox(evo);
			}
		}
	}
	
	let _list = {
		getList: () => {
			let url_v = "/sg/default/list";
			
			let data_v = "";
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.list && resp.list.length > 0) {
					_list.drawList(resp.list);
					_evInit();
				}
			});
		},
		
		drawList: (list) => {
			for(let item of list) {
				let seq = 0;
				
				let pageSizeCode = item.page_size_code;
				
				let target = pageSizeCodes.find((psItem) => psItem.code === pageSizeCode);
				
				if(target) {
					let list_o = $("#" + target.id).html("");
					
					let sgList = item.sg_list;
					if(sgList.length > 0) {
						for(let sgItem of sgList) {
							let tr_o = $("<tr>").attr({
								"data-id": sgItem.dsp_service_ad_id,
							});
							list_o.append(tr_o);
							
							{
								// chkbox
								let td_o = $("<td>");
								td_o.html("<span class='chk'><input id='chk_id"+sgItem.dsp_service_ad_id+"' type='checkbox' name='chk_name"+sgItem.dsp_service_ad_id+"'><label for='chk_id"+sgItem.dsp_service_ad_id+"'></label></span>");
								tr_o.append(td_o);
							}
							{
								// No
								let td_o = $("<td>");
								td_o.html(sgItem.seq);
								tr_o.append(td_o);
							}
							{
								// 구분
								let text = "디폴트";
								if(sgItem.ad_type === "P") {
									text = "공익";
								}
								let td_o = $("<td>").html(text);
								tr_o.append(td_o);
							}
							{
								// 광고명
								let td_o = $("<td>");
								td_o.html(sgItem.name);
								tr_o.append(td_o);
							}
							{
								// 소재
								let path = globalConfig.getS3Url() + sgItem.file_path;
								
								let td_o = $("<td>");
								let wrap_o = $("<button>").addClass("table-thumbWrap hori").attr({
									"type": "button",
									"data-src": "list",
									"data-act": "clickSg",
									"data-video": path,
								});
								td_o.append(wrap_o);
								let video_o = $("<video>").attr({
									"src": path,
									"data-id": sgItem.dsp_service_ad_id
								});
								wrap_o.append(video_o);
								
								let _interval = setInterval(function() {
									if(video_o.get(0).readyState == 4) {
										clearInterval(_interval);
									} else {
										video_o.get(0).load();
									}
								}, 1000);
								tr_o.append(td_o);
							}
							{
								// 재생시간
								let td_o = $("<td>");
								td_o.html(sgItem.playtime);
								tr_o.append(td_o);
							}
							{
								// 용량
								let td_o = $("<td>");
								td_o.html(util.convertByte(sgItem.file_size));
								tr_o.append(td_o);
							}
							{
								// 등록일 
								let td_o = $("<td>");
								td_o.html(sgItem.insert_date_str);
								tr_o.append(td_o);
							}
						}
					} 
				}
			}
		},
	}
	
	function _modalClear() {
		$("#materialAdType").selectpicker("val", "D");
		$("#materialName").val("");
		$("#materialPopMsg").html("").hide();
		$("#materialFile").val("");
		$("#materialFile").next().html("파일을 선택하세요.");
		$("#materialPop #sec15").prop("checked", true);
	}
	
	function _validateData() {
		let data = _getSaveData();
		
		if(data.name == "") {
			return false;
		}
		
		if(!data.dsp_service_ad_file) {
			return false;
		}
		
		return true;
	}
	
	function _getSaveData() { 
		return {
			page_size_code: $("#materialPop").attr("data-code"),
			ad_type: $("#materialAdType").val(),
			name: $("#materialName").val(),
			dsp_service_ad_file: $("#materialFile").get(0).files[0],
			playtime: $("#materialPop").find("input[name='timeOption']:checked").val(),
		}
	}
	
	let _event = {
		// 소재 등록 팝업 클릭 
		clickMaterialPop: (evo) => {
			_modalClear();
			
			let parent_o = $(evo).parents(".active");
			
			let pageSizeCode = parent_o.attr("data-code");
			
			$("#materialPopTitle").html(pageSizeCode);
			
			$("#materialPop").attr("data-code", pageSizeCode).modal("show");
		},
		
		// 소재 등록 확인 버튼 클릭
		clickMaterialAdd: () => {
			let msg_o = $("#materialPopMsg").html("").hide();
			if(!_validateData()) {
				customModal.alert({
					content: "입력되지 않은 항목이 있습니다.<br/>모든 정보를 입력해주세요.",
				});
				return;
			}
			
			let data = _getSaveData();
			
			if(!fileUtil.isUploadableSize(data.dsp_service_ad_file)) {
				msg_o.html("용량이 초과됐습니다.(300mb)").show();
				return;
			}
			
			fileUtil.getFileInfo(data.dsp_service_ad_file, function(fileData) {
				
				let split = data.page_size_code.split("x");
				
				if(split[0] != fileData.width || split[1] != fileData.height) {
					msg_o.html("사이즈가 일치하지 않습니다.").show();
					return;
				}
				
				let fileDuration = fileUtil.floorDuration(fileData.duration);
				if(fileDuration != parseFloat(data.playtime)) {
					msg_o.html("재생시간이 일치하지 않습니다.").show();
					return;
				}
				
				
				let url_v = "/sg/default/add";
				
				let data_v = {
					width: fileData.width,
					height: fileData.height,
				};
				
				data_v = $.extend(true, data, data_v);
				
				comm.sendFile(url_v, util.getFormData(data_v), "POST", function(resp) {
					_list.getList();
					_modalClear();
					$("#materialPop").modal("hide");
				});
			});
			
			return;
			
			let video_o = $("<video>").attr({
				"src": URL.createObjectURL(data.dsp_service_ad_file),
			});
			video_o.on("loadedmetadata", function(v) {
				let videoWidth = this.videoWidth;
				let videoHeight = this.videoHeight;
				let videoDuration = parseInt(this.duration);
				
				let split = data.page_size_code.split("x");
				
				console.log(videoWidth, videoHeight);
				
				if(split[0] != videoWidth || split[1] != videoHeight) {
					msg_o.html("사이즈가 일치하지 않습니다.").show();
					return;
				}
				
				
				
			});
		},
		
		// 소재 삭제 버튼 클릭
		clickMaterialRemove: (evo) => {
			
			let parent_o = $(evo).parents(".active");
			
			let pageSizeCode = parent_o.attr("data-code");
			
			let target = pageSizeCodes.find(psCode => psCode.code === pageSizeCode);
			
			let removeList = [];
			
			let checkedList = $("#" + target.id).find("input[type='checkbox']:checked");
			for(let checked_o of checkedList) {
				let tr_o = $(checked_o).parents("tr");
				let removeId = parseInt(tr_o.attr("data-id"));
				
				removeList.push(removeId);
			}
			
			if(removeList.length > 0) {
				
				customModal.confirm({
					content: "소재가 삭제됩니다. 계속 하시겠습니까?",
					confirmCallback: () => {
						let url_v = "/sg/default/remove";
						
						let data_v = {
							id_list: removeList,
						};
						
						comm.send(url_v, data_v, "POST", function() {
							_list.getList();
						});
					}
				});
			} else {
				
			}
		},
		
		// 리스트에서 광고 클릭시 
		clickSg: (evo) => {
			let videoSrc = $(evo).attr("data-video");
			
			$("#popupVideo").off("loadedmetadata");
			$("#popupVideo").on("loadedmetadata", (e) => {
				let target = e.currentTarget;
				if(target.readyState != 4) {
					$(target).load();
				} else {
					target.play();
					$("#popupPreview").modal("show");
				}
			});
			$("#popupVideo").attr("src", videoSrc);
		},
		
		// 팝업 닫기 버튼 클릭시
		clickPopClose: () => {
			$("#popupVideo").get(0).pause();
		},
		
		changeMaterialFile: (evo) => {
			let file = $(evo).get(0).files[0];
			let inputId = $(evo).attr("id");
			
			fileUtil.setUploadFile(file, inputId, "파일을 선택하세요.");
		},
	}
	
	return {
		init,
	};
})();