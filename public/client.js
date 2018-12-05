// client-side js
// run by the browser each time your view template referencing it is loaded

$("#userComm").keydown(key => {
    if (key.which == 13){
      $("#fetch").trigger('click');
    }
  });
  $("#fetch").click(()=>{
    let url = '/api';
    let comm = $("#userComm").val() == '' ? 'I say, this is all uncivilized.' : $("#userComm").val();
    let data = {text:comm};
    $.ajax({
      type: "POST",
      url: url,
      data: data,
      success: (data)=>{
        let json = JSON.parse(data);
        $("#results").html(json[0].dream);
      }
    });
  }); 

let dreams = [];

// define variables that reference elements on our page
const dreamsList = document.getElementById('dreams');
const dreamsForm = document.forms[0];

// a helper function to call when our request for dreams is done
const getDreamsListener = function() {
  // parse our response to convert to JSON
  console.log(this.responseText);
  dreams = JSON.parse(this.responseText);

  // iterate through every dream and add it to our page
  dreams.forEach( function(row) {
    appendNewDream(row.dream);
  });
}

// request the dreams from our app's sqlite database
const dreamRequest = new XMLHttpRequest();
dreamRequest.onload = getDreamsListener;
dreamRequest.open('get', '/getDreams');
dreamRequest.send();

// a helper function that creates a list item for a given dream
const appendNewDream = function(dream) {
  const newListItem = document.createElement('li');
  newListItem.innerHTML = dream;
  dreamsList.appendChild(newListItem);
}
