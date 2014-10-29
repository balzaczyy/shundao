function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
  
var fx = getURLParameter('fx') || 121.590736692;
var fy = getURLParameter('fy') || 31.202558763477;
var tx = getURLParameter('tx') || 121.51330805704;
var ty = getURLParameter('ty') || 31.246948690055;

var pStart = new BMap.Point(fx, fy);
var pEnd = new BMap.Point(tx, ty);

var map = new BMap.Map("allmap");
map.centerAndZoom(new BMap.Point((pStart.lng+pEnd.lng)/2, (pStart.lat+pEnd.lat)/2), 12);

var left = pStart.lng < pEnd.lng ? pStart.lng : pEnd.lng;
var up = pStart.lat < pEnd.lat ? pStart.lat : pEnd.lat;
var right = pStart.lng > pEnd.lng ? pStart.lng : pEnd.lng;
var down = pStart.lat > pEnd.lat ? pStart.lat : pEnd.lat;

var afterSearch = $.Deferred();
var local = new BMap.LocalSearch(map, {
  onSearchComplete: function(result) {
    if (local.getStatus() == BMAP_STATUS_SUCCESS) {
      var s = [];
      for (var i = result.getCurrentNumPois()-1; i >= 0; i--) {
        s.push(result.getPoi(i).point);
      }
      afterSearch.resolve(s);
    }
  }
});
local.searchInBounds("加油站", new BMap.Bounds(
  new BMap.Point(left, up),
  new BMap.Point(right, down)
));

var afterSelect = $.Deferred();
afterSearch.then(function(results) {
  var count = results.length * 2;
  var s = [];
  results.forEach(function(mid, idx) {
    var driving = new BMap.DrivingRoute(map, {
      onSearchComplete: function(result) {
        if (driving.getStatus() == BMAP_STATUS_SUCCESS) {
          var plan = result.getPlan(0);
          if (s[idx]) {
            s[idx].value += plan.getDuration(false);
          } else {
            s[idx] = { point: mid, value: plan.getDuration(false) };
          }
        }
        if (--count === 0) {
          afterSelect.resolve(s);
        }
      }
    });
    driving.search(pStart, mid);
    driving.search(mid, pEnd);
  });
});

afterSelect.then(function(results) {
  var minDuration = 10000;
  var mid;
  results.forEach(function(item) {
    if (item.value < minDuration) {
      minDuration = item.value;
      mid = item.point;
    }
  });

  map.clearOverlays();
  driving = new BMap.DrivingRoute(map, {
    onSearchComplete: function(result) {
      if (driving.getStatus() == BMAP_STATUS_SUCCESS) {
        // draw lines connecting start, middle, and end point
        var pts = result.getPlan(0).getRoute(0).getPath();
        var polyline = new BMap.Polyline(pts);
        map.addOverlay(polyline);
      }
    }
  });
  driving.search(pStart, mid);
  driving.search(mid, pEnd);

  map.addOverlay(new BMap.Marker(pStart));
  map.addOverlay(new BMap.Marker(mid));
  map.addOverlay(new BMap.Marker(pEnd));
  map.addOverlay(new BMap.Label('起点', {position: pStart}));
  map.addOverlay(new BMap.Label('加油站', {position: mid}));
  map.addOverlay(new BMap.Label('终点', {position: pEnd}));

  setTimeout(function(){
    map.setViewport([pStart, mid, pEnd]);
  },1000);
});
