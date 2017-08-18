(function() {

    var pos = { x: 0, y: 0 };
    var mouseDownStatus = false;

    var setPosition = function (e) {
        pos.x = e.offsetX;
        pos.y = e.offsetY;
    };

    var draw = function(e){
        // reference to html:
        var context = $('#canv')[0].getContext('2d');

        //prepare strokes:
        context.strokeStyle = 'black';
        context.lineWidth = '3';
        context.lineCap = 'round';

        //begin:
        context.beginPath();

        context.moveTo(pos.x, pos.y);           // from
        setPosition(e);                         // check new position
        context.lineTo(pos.x, pos.y);           // to
        context.stroke();                       // draw it!
    };

    //log mouse positions on mousedown:
    $('#canv').mousedown(setPosition, function(e){
        mouseDownStatus = true;
        setPosition(e);
    });

    $('#canv').mousemove(setPosition, function(e){
        if (mouseDownStatus) {
            draw(e);
        }
    });

    $('#canv').mouseup(function(){
        mouseDownStatus = false;
    });

    //store signature image data in hidden input on submit click:
    var storeSignature = function(){
        var dataURL = $('#canv')[0].toDataURL();
        // console.log(dataURL);
        $('#sig-inpt').val(dataURL);
        // console.log($('#sig-inpt'));
    };

    $('#submit-btn').on("click", function(){
        storeSignature();
    });


}());
