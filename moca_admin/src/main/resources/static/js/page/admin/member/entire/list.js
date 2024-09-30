const allMemberList = (function(){
	
	// 페이지 초기화 함수
	function init(){
		_list.getRoleCnt();
		_list.getList();
		_evInit();
	}
	// 이벤트 초기화 
	function _evInit(){
		let evo = $("[data-src='allMemberList'][data-act]").off();
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
			//검색 버튼
			if(act_v == "getSearch"){
				_list.getList();
			//타입별 검색
			}else if(act_v == "clickTypeBtn"){
				event.clickTypeBtn(evo);
			//클릭시 해당 id로 로그인
			}else if(act_v == "memberLogin"){
				event.memberLogin(evo);
			}else if(act_v == "excelDownLoad"){
				event.excelDownLoad();
			}
		}else if(type_v == "keyup"){
			//엔터키 검색
			if(act_v =="searchEnter"){
				if(ev.keyCode == 13) {
					_list.getList();
				}
				
			}
			
		}
	}
	let _event = {
		//권한 선택시 리스트 가져온다.
		clickTypeBtn: function(evo){
			$("button[name=searchType]").removeClass("active");
			$(evo).addClass("active");
			_list.getList();
		},
		//선택한 회원으로 로그인
		memberLogin: function(evo){
			let memberId = $(evo).attr("data-id");
			let memberUid = $(evo).attr("data-uid");
			let memberUtype = $(evo).attr("data-utype");
			util.staffLogin({
				memberId,
				memberUid,
				memberUtype
			});
		},
		//엑셀 다운로드
		excelDownLoad: function(curPage = 1){
			let url_v = "/member/user/list/excel";
			
			let data_v = {
				utype: $(".active").attr("data-type")
				, search_type: $("#searchType").val()
				, search_text: $("#searchText").val()
			}
			
			
			util.blobFileDownload(url_v, data_v, function(){
				console.log("done")				
			});
			
		}
	}
	
	let _list = {
		getRoleCnt: function(){
			let url_v = "/member/role/cnt";
			
			comm.send(url_v, null, "POST", function(resp){
				if(resp.result){
					_list.drawRoleMemberCnt(resp.role_member_cnt);
					_evInit();
				}
			});
		},
		getList: function(curPage = 1){
			let url_v = "/member/user/list";

			let data_v = {
				utype: $(".active").attr("data-type")
				, search_type: $("#searchType").val()
				, search_text: $("#searchText").val()
			}
			let page_o = $("#listPage").customPaging(null, function(_curPage){
				_list.getList(_curPage);
			});
			
			let pageParam = page_o.getParam(curPage);
			
			if(pageParam){
				data_v.offset = pageParam.offset;
				data_v.limit = pageParam.limit;
			}
			
			comm.send(url_v, data_v, "POST", function(resp){
				if(resp.result){
					_list.drawList(resp.list);
					page_o.drawPage(resp.tot_cnt);
					
					_evInit();
				}
			});
		},
		drawList: function(list){
			let body_o = $("#memberListBody").html("");
			
			for(let item of list){
				let tr_o = $("<tr>");
				
				if(item.status != "A"){
					tr_o.addClass("deleteLine");
				}
				
				body_o.append(tr_o);
				//구분
				{
					let td_o = $("<td>");
					let role_name = "";
					if(item.utype == "B"){
						role_name = "대행사"
					}else if(item.utype == "D"){
						role_name = "광고주"
					}else if(item.utype =="S"){
						role_name = "매체사"
					}
					td_o.html(role_name);
					tr_o.append(td_o);
				}
				//회원명
				{
					let td_o = $("<td>").html(item.company_name);
					tr_o.append(td_o);
				}
				//회원 ID
				{
					let td_o = $("<td>");
					if(item.status == "A"){
						let a_o = $("<a>").attr({
							"href": "javascript:;"
							, "data-id": item.member_id
							, "data-uid": item.uid
							, "data-utype": item.utype
							, "data-src": "allMemberList"
							, "data-act": "memberLogin"
						});
						a_o.html(item.uid);
						td_o.html(a_o);
					}else{
						td_o.html(item.uid);
					}
					tr_o.append(td_o);
				}
				//가입일자
				{
					let td_o = $("<td>").html(item.insert_date);
					tr_o.append(td_o);	
				}
				//이메일
				{
					let td_o = $("<td>");
					if(item.status == "A"){
						let a_o = $("<a>").attr({
							"href": "mailto:" + item.company_email
						});
						a_o.html(item.company_email);
						td_o.append(a_o);
					}else{
						td_o.html(item.company_email);
					}
					
					tr_o.append(td_o);
				}
				//email 동의
				{
					let msg = "비동의";
					if(item.accept_email == "Y"){
						msg = "동의";
					}
					let td_o = $("<td>").html(msg);
					tr_o.append(td_o);
				}
			}
		},
		drawRoleMemberCnt: function(cntList){
			$("#allCnt").html("전체 : " +cntList.all_cnt);
			$("#agencyCnt").html("대행사 : " +cntList.agency_cnt);
			$("#demandCnt").html("광고주 : " +cntList.demand_cnt);
			$("#supplyCnt").html("매체사 : "+ cntList.supply_cnt);
		}
		
	}
	
	return {
		init
	}
})();