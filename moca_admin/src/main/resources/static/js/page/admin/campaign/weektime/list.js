const weektimeList = (function () {
	
	let _weektimeList = [];
	
	// 해당 페이지 초기화 함수
	function init(){
		_list.getList();
	}
	
	// 이벤트 초기화 
	function _evInit() {
		let evo = $("[data-src='weektimeList'][data-act]").off();
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
			if(act_v == "clickModifyWeekTime") {
				event.clickModifyWeekTime();
			} else if(act_v == "clickTime") {
				event.clickTime(evo);
			} else if(act_v == "clickInitTime") {
				event.clickInitTime();
			}
		} 
	}
	
	const _list = {
		getList: function() {
			let url_v = "/common/weektime/list";
			
			comm.send(url_v, null, "POST", function(resp) {
				if(resp.result) {
					_weektimeList = resp.list;
					_list.drawList(_weektimeList);
				}
			});
		},
		
		drawList: function(list) {
			let weektimeList = new Array(7);

			if(list && list.length > 0) {
				weektimeList = list;
			}
			let body_o = $("#listBody").empty();
			
			for(let i = 0; i < 24; i++) {
				let tr_o = $("<tr>");
				{
					let start = _numberPad(i, 2) + ":00";
					let end = _numberPad(i + 1, 2) + ":00";
					
					$.each(weektimeList, function(idx, o) {
						if(idx == 0){
							// 시간/요일
							let th_o = $("<th>").text(start + " ~ " + end);
							tr_o.append(th_o);
						}
						
						// 요일별 시간 
						let td_o = $("<td>").attr({
							"data-src": "weektimeList",
							"data-act": "clickTime" 
						}).text(start + " ~ " + end);
						tr_o.append(td_o);
							
						let dataIdx = idx == 6 ? 0 : idx + 1;
						
						// 서버에서 가져온 데이터가 있으면 데이터 설정
						if(o && o.week_code == dataIdx) {
							let isPick = o["hour_" + _numberPad(i, 2)];
							
							if(isPick == 0) {
								td_o.addClass("pick");
							}
						}
					});
				}
				body_o.append(tr_o);
			}
			_evInit();
			
			_createDragCheckPlugin();
			$("td").dragCheckbox();
		},
	}
	
	const _data = {
		// 수정 데이터
		getSubmitData: function() {
			let weekTimeList = [];
				
			for(let i = 0; i < 7; i++) {
				let time = {
					week_code: i == 6 ? 0 : i + 1,
				};
				
				$("#listBody > tr").each(function (idx, o){
					let isPick = $(o).find("td").eq(i).hasClass("pick");

					let key = "hour_" + _numberPad(idx, 2);
					time[key] = isPick ? 0 : 1;
				});
				weekTimeList.push(time);
			}
			return weekTimeList;
		}	
	}
	
	// 이벤트 담당
	const _event = {
		// 시간대 클릭
		clickTime: function(evo) {
			evo.toggleClass("pick");
		}, 
		
		// 선택 시간 초기화 
		clickInitTime: function() {
			_list.drawList();
		},
		
		// 시간옵션 수정
		clickModifyWeekTime: function() {
			let url_v = "/common/weektime/modify";
			
			let data_v = {
				weektime_json: _data.getSubmitData(),	
			};
			
			comm.send(url_v, data_v, "POST", function(resp) {
				if(resp.result) {
					_list.getList();
				}
			});
		},
	}
	
	// 드레그 체크 플러그인
	function _createDragCheckPlugin(){
		$.fn.dragCheckbox = function () {
		    var source = this;
		    var ConditionA = false;
	        var ConditionB = false;
	        source.parent().css({
	          '-webkit-user-select': 'none',
	          '-moz-user-select': 'none',
	          '-ms-user-select': 'none',
	          '-o-user-select': 'none',
	          'user-select': 'none'
	        });
	        source.mousedown(function(){
	          ConditionA = true;
	          ConditionB = true;
	        });
	        $(document).mouseup(function(){
	          ConditionA = false;
	          ConditionB = false;
	        })
	        source.mouseenter(function(){
	          if(ConditionA != false) {
	            $(this).trigger('click');
	          }
	        });
	        source.mouseout(function(){
	          if(ConditionA != false && ConditionB != false) {
	            $(this).trigger('click');
	            ConditionB = false;
	          }
	        });
		}
	}
	
	// 숫자 앞에 0으로 채우기
	function _numberPad(inputNum, pad){
		return inputNum < 10 ? String(inputNum).padStart(pad, "0") : inputNum;
	}
	
	return {
		init
	}
	
})();