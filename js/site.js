function createDropDown(id,filterid,title,list){
    var html="<h5>"+title+"</h5><select id='"+filterid+"'><option selected>All</option>";
    list.forEach(function(e){
        html += "<option>" + e.key + "</option>";
    });
    html+="</select>";
    $(id).html(html);
}

function populateTable(list){
    var html = "<table><tr><th>Region</th><th>Domain</th><th>Organisation</th><th>Activity type</th><th>Notes</th></tr>";
    list.forEach(function(e){
        html += "<tr><td>" + e.region + "</td><td>" + e.sector + "</td><td>" + e.org + "</td><td>" + e.activity_type + "</td><td>" + e.x_activity + "</td></tr>";
    });
    html +="</table>";
    $("#information_table").html(html);
}

function updateMap(list){
     d3.selectAll("path").attr("opacity",0);
     list.forEach(function(e){
        if(e.key!="#N/A"&&e.value>0){d3.selectAll("#"+e.key).attr("opacity",1)};
     });
}

function initMap(){
    var base_hotosm = L.tileLayer(
        'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{
        attribution: '&copy; OpenStreetMap contributors, <a href="http://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>'}
    );
    
    var map = L.map('map', {
        center: [9.9,-11.5],
        zoom: 7,
        layers: [base_hotosm]
    });
    
    var overlay_prefectures = L.geoJson(prefectures).addTo(map);     
    
    overlay_prefectures.eachLayer(function (layer) {
        console.log(layer);
        if(typeof layer._path != 'undefined'){
            layer._path.id = layer.feature.properties.ADM2_CODE;
        } else {
            layer.eachLayer(function (layer2){
                layer2._path.id = layer.feature.properties.ADM2_CODE;
            });
        }
    });    
}

var cf = crossfilter(data);
var bySector = cf.dimension(function(d){return d.sector;});
var countBySector = bySector.group();

createDropDown("#sector_filter","domainDD","Domain",countBySector.all());

$("#domainDD").change(function() {
    console.log($(this).val());
    if($(this).val()=="All"){
        bySector.filterAll();
    } else {
        bySector.filterAll();
        bySector.filter($(this).val());
    }
    populateTable(bySector.bottom(Infinity));
    updateMap(countByRegion_id.all())
});

var byRegion = cf.dimension(function(d){return d.region;});
var countByRegion = byRegion.group();

createDropDown("#region_filter","regionDD","Region",countByRegion.all());

$("#regionDD").change(function() {
    console.log($(this).val());
    if($(this).val()=="All"){
        byRegion.filterAll();
    } else {
        byRegion.filterAll();
        byRegion.filter($(this).val());
    }
    populateTable(byRegion.bottom(Infinity));
    updateMap(countByRegion_id.all())
});

var byOrg = cf.dimension(function(d){return d.org;});
var byRegion_id = cf.dimension(function(d){return d.region_id;});
var countByRegion_id = byRegion_id.group();

//var cf = crossfilter(data);
//var byActivity = cf.dimension(function(d){return d.activity_type;});
//var countByActivity = byActivity.group();

//createDropDown("#activity_filter","Activity",countByActivity.all());

populateTable(byRegion.bottom(Infinity));
initMap();