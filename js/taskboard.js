$(function() {
	TaskUpdate.init();
});

TaskUpdate = {
	updateURL:'test.json',//AJAX Update Route (id is added dynamically)
        addURL:'test.json',//AJAX Add Route
	taskReceived:false,//used for checking tasks resorted within the same list or to another
        newTaskId:0,//keep track of new tasks in case there are a few error tasks
	init: function(){
		
                //initialize sorting / drag / drop
		$("td.droppable").sortable({
			connectWith: 'td.droppable',
			placeholder: "card task placeholder",
			receive: function(event, ui){
				TaskUpdate.TaskUpdateReceive($(ui.item), $(ui.sender), $(this).sortable('serialize'));
				TaskUpdate.taskReceived = true;//keep from repeating if changed lists
			},
			stop: function(event, ui){
                            if(TaskUpdate.taskReceived !== true){
                                TaskUpdate.TaskUpdateSame($(ui.item), $(this).sortable('serialize'));
                            }
                            else{
                                TaskUpdate.taskReceived = false;
                            }
			}
		}).disableSelection();
		
                //initialize modal double clicks
		$(".card.task").dblclick(function(){
			TaskUpdate.modalEdit($(this));
		});	
                
                //initialize modal window
		$( "#task-dialog" ).dialog({
		  autoOpen: false,
		  height: 520,
		  width: 350,
		  modal: true,
		  buttons: {
			"Update": function() {
				
			 },
			Cancel: function() {
			  $( this ).dialog( "close" );
			}
		  },
		  close: function() {
			//allFields.val( "" ).removeClass( "ui-state-error" );
		  }
		});
                
                //initialize add buttons on stories
                $( ".add-task" ).click(function(){
                    TaskUpdate.modalAdd($(this));
                });
                
                //add in date picker on task update
                $( ".due-date" ).datepicker();
	},
	modalEdit: function(data){
            user = $(data).find('.owner').text().trim();
            userColor = $(data).css('border-color');
            taskId = $(data).attr('id');
            taskId = taskId.replace('task_', '');
            title = $(data).find('.title').text().trim();
            description = $(data).find('.description').text().trim();
            hours = $(data).find('.hours').text().trim();
            date = $(data).find('.due-date').text().trim();

            $( "#task-dialog input#taskId" ).val(taskId);
            $( "#task-dialog textarea#title" ).val(title);
            $( "#task-dialog textarea#description" ).val(description);
            $( "#task-dialog input#hours" ).val(hours);
            $( "#task-dialog input#due-date" ).val(date);
            TaskUpdate.setOptionByText("#task-dialog", user);                
            
            $( "#task-dialog" ).dialog({ title: "Edit Task" });
            $( "#task-dialog" ).dialog( "open" );
            $( "#task-dialog" ).dialog({buttons:{
                   "Update": function() {
                        TaskUpdate.updateCard(data, $( "form#task-dialog" ).serializeObject());
                        $( "#task-dialog" ).dialog( "close" );
                     },
                    Cancel: function() {
                      $( this ).dialog( "close" );
                    } 
            }});
            TaskUpdate.changeModalColor(userColor);
        },
        modalAdd: function(data){
            $( "#task-dialog input#taskId" ).val("");
            $( "#task-dialog textarea#title" ).val("");
            $( "#task-dialog textarea#description" ).val("");
            $( "#task-dialog input#hours" ).val("");
            $( "#task-dialog input#due-date" ).val("");
            TaskUpdate.setOptionByText("#task-dialog", "");
            TaskUpdate.changeModalColor("#E7E7E7");
            $( "#task-dialog" ).dialog({ title: "Add Task" });
            $( "#task-dialog" ).dialog( "open" );
            $( "#task-dialog" ).dialog({buttons:{
                   "Update": function() {
                        TaskUpdate.addCard(data, $( "form#task-dialog" ).serializeObject());
                        $( "#task-dialog" ).dialog( "close" );
                     },
                    Cancel: function() {
                      $( this ).dialog( "close" );
                    } 
            }});        
        },
        changeModalColor: function(userColor){
            $( ".ui-dialog" ).css( "border", "7px solid "+userColor);
        },
        changeUser: function(selected){
            color = $(selected).find("option:selected").attr("data-color");
            TaskUpdate.changeModalColor(color);
        },
        setOptionByText: function(selectId, text){
            $(selectId+" option").filter(function() {
                return $(this).text() == text;
            }).prop('selected', true);
        },
        getTextByOption: function(selectId, val){
            var text =  $(selectId+" option[value='"+val+"']").text();
            return text;
        },
        updateCard: function(card, data){
            $(card).find( ".title" ).text(data.title);
            $(card).find( ".hours" ).text(data.hours);
            $(card).find( ".description" ).text(data.description);
            $(card).find( ".due-date" ).text(data.due-date);
            $(card).find( ".owner" ).text($("#task-dialog option[value='"+data.assigned+"']").text());
            $(card).css("border-color", $("#task-dialog option[value='"+data.assigned+"']").attr("data-color"));
            TaskUpdate.ajaxUpdateTask(data);
        },
        addCard: function(story, data){
            var row = story.parent().parent().parent().parent();
            var cell = row.find("td.column-2");
            console.log(cell);
            cell.append($(".cloneable:last").clone());
            card = cell.find(".cloneable:last");
            
            $(card).find( ".title" ).text(data.title);
            $(card).find( ".hours" ).text(data.hours);
            $(card).find( ".description" ).text(data.description);
            //$(card).find( ".due-date" ).text(data.due-date);
            $(card).find( ".owner" ).text($("#task-dialog option[value='"+data.assigned+"']").text());
            $(card).css("border-color", $("#task-dialog option[value='"+data.assigned+"']").attr("data-color"));
            card.show();            
            TaskUpdate.ajaxAddTask(data);
        },
	TaskUpdateReceive: function (task, sender, receiverSerialized){//if the task changes statuses/stories
		taskId = $(task).attr("id");
		taskId = taskId.replace("task_","");
		receiverStatus = $(task).parent().attr("data-status");
		receiverStory = $(task).parent().parent().attr("data-story-id");
		senderStatus = $(sender).attr("data-status");
		senderStory = $(sender).parent().attr("data-story-id");	
		
		if(typeof(senderStatus) !== "undefined"){
			senderSerialized = $(sender).sortable('serialize');
			
			data = {
				taskId: taskId,
				sender: {"story":senderStory, "status":senderStatus, "sortingOrder":senderSerialized},
				receiver: {"story":receiverStory, "status":receiverStatus, "sortingOrder":receiverSerialized}			
			}			
			
			TaskUpdate.ajaxSendTaskPosition(data);
		}
	},
	TaskUpdateSame: function(task, receiverSerialized){
		taskId = $(task).attr("id");
		taskId = taskId.replace("task_","");
		receiverStatus = $(task).parent().attr("data-status");
		receiverStory = $(task).parent().parent().attr("data-story-id");	
		
		data = {
			taskId: taskId,
			receiver: {"story":receiverStory, "status":receiverStatus, "sortingOrder":receiverSerialized}
		}

		TaskUpdate.ajaxSendTaskPosition(data);
			
	},
	ajaxSendTaskPosition:function(data){
            taskId = data.taskId;
            TaskUpdate.block(taskId);
            $.ajax({
              type: "POST",
              url: TaskUpdate.updateURL+"/"+taskId,
              data: data,
              success: function(data, textStatus, jqXHR){
                    TaskUpdate.unBlock(taskId);
              },
              error: function(jqXHR, textStatus, errorThrown){
                    TaskUpdate.unBlock(taskId);
                    TaskUpdate.showError(taskId);
              }		  
            });
	},
        ajaxUpdateTask: function(data){
            taskId = data.taskId;
            TaskUpdate.block(taskId);
            $.ajax({
              type: "POST",
              url: TaskUpdate.updateURL+"/"+taskId,
              data: data,
              success: function(data, textStatus, jqXHR){
                    TaskUpdate.unBlock(taskId);                    
              },
              error: function(jqXHR, textStatus, errorThrown){
                    TaskUpdate.unBlock(taskId);
                    TaskUpdate.showError(taskId);
              }		  
            });
        },
        ajaxAddTask: function(data){
            taskId = data.taskId;
            TaskUpdate.block(taskId);
            $.ajax({
              type: "POST",
              url: TaskUpdate.addURL,
              data: data,
              success: function(data, textStatus, jqXHR){
                    TaskUpdate.unBlock(taskId);
                    $( "task_"+taskId ).find(".task-id").text(data.taskId);// ****** THIS NEEDS
              },
              error: function(jqXHR, textStatus, errorThrown){
                    TaskUpdate.unBlock(taskId);
                    TaskUpdate.showError(taskId);
              }		  
            });
        },
	block:function(taskId){
		task = $('#task_'+taskId);
		task.append('<div class="spinner"></div>');
	},
	unBlock:function(taskId){
		task = $('#task_'+taskId);
		task.find('.spinner').remove();
	},
        showError:function(taskId){
            task = $('#task_'+taskId);
            task.css({"opacity":".8"});
            task.append('<div class="error"></div>');
        }
}

jQuery.fn.serializeObject = function() {
  var arrayData, objectData;
  arrayData = this.serializeArray();
  objectData = {};

  $.each(arrayData, function() {
    var value;

    if (this.value != null) {
      value = this.value;
    } else {
      value = '';
    }

    if (objectData[this.name] != null) {
      if (!objectData[this.name].push) {
        objectData[this.name] = [objectData[this.name]];
      }

      objectData[this.name].push(value);
    } else {
      objectData[this.name] = value;
    }
  });

  return objectData;
};