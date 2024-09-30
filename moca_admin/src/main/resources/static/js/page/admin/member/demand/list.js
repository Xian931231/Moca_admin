const demandRequestList= (function(){
	
	// 페이지 초기화 함수
	function init(){
		_list.getList();
		_evInit();
	}
	// 이벤트 초기화 
	function _evInit(){
		let evo = $("[data-src='demandRequestList'][data-act]").off();
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
		
		if(type_v == "click"){
			if(act_v == "downloadImg"){
				event.downloadImg(evo);
			}else if(act_v == "memberLogin"){
				event.memberLogin(evo);
			}else if(act_v =="moveCompanyModify"){
				event.moveCompanyModify(evo);
			}
		}
	}
	
	let _event = {
		//클릭한 회원으로 로그인
		memberLogin: function(evo){
			let memberId = $(evo).attr("data-id");
			let memberUid = $(evo).attr("data-uid");
			let memberUtype = $(evo).attr("data-utype");
			util.staffLogin({
				memberId,
				memberUid,
				memberUtype,
			});
		},
		//사업자 정보 입력 페이지 이동
		moveCompanyModify: function(evo){
			let member_id = $(evo).attr("data-mem-id");
			let request_id = $(evo).attr("data-req-id");
			location.href = "/member/info/company/modify?request_id="+request_id;
		},
		//이미지 다운로드
		downloadImg: function(evo){
			let filePath = $(evo).attr("data-path");
			
			var downloadLink = $("<a>").attr({
				"id": "downloadImg"
				, "href": globalConfig.getS3Url() + filePath
				, "target": "_blank"
				, "download": true
			});
			
          	$("#listBody").append(downloadLink);
          	$("#downloadImg").get(0).click();
          	$("#downloadImg").remove();
		}
	}
	
	let _list = {
		getList: function(curPage = 1){
			let url_v = "/member/modify/request/list";
			let data_v = {
				utype: "D"
			};
			
			let page_o = $("#listPage").customPaging(null, function(_curPage){
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			if(pageParam){
				data_v.offset = pageParam.offset;
				data_v.limit = pageParam.limit;
			}
			
			comm.send(url_v, data_v, "POST", function(resp){
				
				_list.drawList(resp.list);
				page_o.drawPage(resp.tot_cnt);
			});
		},
		drawList: function(list){
			let body_o = $("#listBody").html("");
			for(let item of list){
				let tr_o = $("<tr>");
				body_o.append(tr_o);
				
				//구분
				{
					let msg = "매사";
					if(item.utype == "D"){
						msg = "광고주";
					}else if(item.utype == "B"){
						msg = "대행사";
					}else if(item.utype == "A"){
						msg = "관리자";
					}
					
					let td_o = $("<td>").html(msg);
					
					tr_o.append(td_o);	
				}
				//회원명
				{
					let td_o = $("<td>").html(item.company_name+"<br>");
					let a_o = $("<a>").attr({
						"href": "javascript:;"
						, "data-src": "demandRequestList"
						, "data-act": "memberLogin"
						, "data-id": item.member_id
						, "data-uid": item.uid
						, "data-utype": item.utype
					});
					a_o.html("("+item.uid+")");
					td_o.append(a_o);
					tr_o.append(td_o);
				}
				//요청 일자
				{
					let td_o = $("<td>").html(item.insert_date);
					tr_o.append(td_o);
				}
				//사엽자 등록증
				{
					let company_regnum_image = item.req_company_regnum_image
					let company_file_name = item.req_company_regnum_file_name;
					if(item.status == 1){
						company_regnum_image = item.company_regnum_image
						company_file_name = item.company_regnum_file_name;
					}
					
					let td_o = $("<td>");
					
					let div_o = $("<div>").addClass("business-cus");
					
					let name_o = $("<div>").addClass("bus-license");
					name_o.html(company_file_name);
					div_o.append(name_o);
					
					let icon_o = $("<div>").addClass("icon_down");
					let img_o = $("<img>").attr({
						"src": "/assets/imgs/icon_download.png"
						,"data-src": "demandRequestList"
						, "data-act": "downloadImg"
						, "data-path": company_regnum_image
					});
					icon_o.append(img_o);
					
					div_o.append(icon_o);
					td_o.append(div_o);
					tr_o.append(td_o);
					
				}
				//처리 현황
				{
					let td_o = $("<td>");
					
					if(item.status == 0){
						let a_o = $("<a>").attr({
							"href": "javascript:;"
							, "data-src": "demandRequestList"
							, "data-act": "moveCompanyModify"
							, "data-req-id": item.request_id
							, "data-mem-id": item.member_id
						});
						a_o.html("수정 대기");
						td_o.append(a_o); 	
					}else {
						td_o.html("수정 완료");
					}
					tr_o.append(td_o);
				}
			}
			_evInit();
		}
	}
	
	return{
		init
	}
	
})();