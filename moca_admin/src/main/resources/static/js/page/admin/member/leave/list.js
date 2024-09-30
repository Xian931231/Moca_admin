const leaveList= (function(){
	// 페이지 초기화 함수
	function init(){
		_list.getList();
		_evInit();
	}
	// 이벤트 초기화 
	function _evInit(){
		let evo = $("[data-src='leaveList'][data-act]").off();
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
			if(act_v == "setLeaveModal"){
				event.setLeaveModal(evo);
			}else if(act_v =="leaveMember"){
				event.leaveMember(evo);
			}
		}
	}
	
	let _event = {
		//탈퇴 처리 팝업 세팅
		setLeaveModal: function(evo){
			$("#passwd").val("");
			$("#leaveReason").val(util.unescapeData($(evo).attr("data-text")));
			$("#leaveBtn").attr({
				"data-id":$(evo).attr("data-id")
			});
		},
		//탈퇴 처리
		leaveMember: function(evo){
			let url_v = "/member/leave/request/accept";
			let data_v = {};
			
			let passWd = $("#passwd").val();

			if(util.valNullChk(passWd)){
				customModal.alert({
					content: "비밀번호를 다시 확인하고 입력해주세요."
				});
				return false;
			}
			
			data_v.passwd = passWd;
			data_v.member_id = $(evo).attr("data-id");
			data_v.leave_reason = $("#leaveReason").val();
			
			comm.send(url_v, data_v, "POST", function(resp){
				let msg = "탈퇴 실패 했습니다.";
				if(resp.result){
					msg = "탈퇴 처리 되었습니다.";
				}else{
					if(resp.code == 2212){
						msg = "비밀번호를 다시 확인하고 입력해주세요.";
					}
				}
				customModal.alert({
					content:msg
				});
				$("#depo2").modal("hide");
				
				_list.getList();
			});
			
		},
	}
	
	let _list = {
		getList: function(curPage = 1){
			let url_v = "/member/leave/request/list";
			let data_v = {};
			
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
					let msg = "매체사";
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
					let td_o = $("<td>").html(item.company_name);
					tr_o.append(td_o);
				}
				//ID
				{
					let td_o = $("<td>").html(item.uid);
					tr_o.append(td_o);
				}
				//요청 일자
				{
					let td_o = $("<td>").html(item.leave_request_date);
					tr_o.append(td_o);
				}
				//처리 상태
				{
					let td_o = $("<td>");
					if(item.status == 'R'){
						let a_o = $("<a>").attr({
							"href": "javascript:;"
							,"data-toggle": "modal"
							,"data-target": "#depo2"
							,"data-src": "leaveList"
							,"data-act": "setLeaveModal"
							,"data-id": item.id
							,"data-text": item.leave_reason 
						});
						a_o.html("미처리");
						td_o.append(a_o);	
					}else{
						td_o.html("완료");
					}
					
					tr_o.append(td_o);
				}
				//처리자
				{
					msg = "-";
					if(item.leave_process_member_uid != null && item.leave_process_member_uid != ""){
						msg = item.leave_process_member_uid ;
					}
					let td_o = $("<td>").html(msg);
					tr_o.append(td_o);
				}
				//처리일자
				{
					msg = "-";
					if(item.leave_process_date != null && item.leave_process_date != ""){
						msg = item.leave_process_date ;
					}
					let td_o = $("<td>").html(msg);
					tr_o.append(td_o);	
				}
				//탈퇴 사유
				{
					msg = "-";
					if(item.leave_reason != null && item.leave_reason != ""){
						msg = item.leave_reason ;
					}
					let td_o = $("<td>").html(msg);
					tr_o.append(td_o);
				}
				
			}
			_evInit();
		}
	}
	return {
		init
	}
})();