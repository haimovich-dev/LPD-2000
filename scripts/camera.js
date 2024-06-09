//global vars

var socket = null;
var currentImage = null;

//listeners

document.getElementById("startStream").addEventListener('click', async()=>{
    if(socket==null){
        socket = new WebSocket('ws://172.20.10.4:80/userStream');

        socket.addEventListener('message',(event)=>{
            
            if(event.data=="1"){
                alert("camera is not connected");
                return;
            }else if(event.data.toString()[0]=="2"){
                alert(`license plate detected: ${event.data.toString().slice(2,-1)}`);
            }else if(event.data.toString()[0]=="3"){
                alert(`${event.data.toString().slice(1)}`);
            }else{
                var blob_obj = event.data;
                currentImage = blob_obj;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgTag = document.getElementById("streamOBJ");
                    imgTag.src = event.target.result;
                };
                reader.readAsDataURL(blob_obj);
            }
        })
    }else{
        return;
    }
})
document.getElementById("stopStream").addEventListener('click', async ()=>{
    if(socket!=null){
        socket.close();
        socket = null;
        document.getElementById("streamOBJ").src = "/gallery/neuro-net-wallpaper.jpg";
        return;
    }else{
        return;
    }
})
document.getElementById("getLicensePlate").addEventListener('click', async()=>{
    
    if(socket==null){
        alert("You must turn on the stream first");
    }else{
        if(currentImage==null){
            alert("No Image in buffer");
        }else{
            socket.send(currentImage);
        }
    }
})

//this event listener is resposible for checking if the user is
//still observing the stream, in case the user does not stops it
//it stops it automatically
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden' && socket!=null) {
      socket.close();
      socket = null;
      document.getElementById("streamOBJ").src = "/gallery/neuro-net-wallpaper.jpg";
    }
});