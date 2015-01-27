function createDropDown(id,filterid,title,list){
    var html="<h5>"+title+"</h5><select id='"+filterid+"'><option selected>All</option>";
    list.forEach(function(e){
        html += '<option value="'+e.key+'">' + e.key + '</option>';
    });
    html+="</select>";
    $(id).html(html);
}

function populateTable(list){
    var html = "<table><tr><th>Préfecture</th><th>Axes d'interventions</th><th>Organisation</th><th>Activités</th><th>Description</th></tr>";
    list.forEach(function(e){
        html += "<tr><td>" + e.region + "</td><td>" + e.sector + "</td><td>" + e.org + "</td><td>" + e.activity_type + "</td><td>" + e.x_activity + "</td></tr>";
    });
    html +="</table>";
    $("#information_table").html(html);
}

function updateMap(list){
     d3.selectAll("path").attr("opacity",0.1);
     d3.selectAll("path").attr("fill","#cccccc");
     list.forEach(function(e){
        if(e.key!="#N/A"&&e.value>0){
            d3.selectAll("#"+e.key).attr("opacity",0.6);
            d3.selectAll("path").attr("fill-opacity",1);
            d3.selectAll("path").attr("fill","yellow");
            d3.selectAll("path").attr("stroke","green");
        };  
     });
}

function setRegionFilter(list){
    list.forEach(function(e){
        if(e.key!="#N/A"&&e.value>0){$("#regionDD").val(e.key);};
    });
}

function reduceFilter(id,list){
    list.forEach(function(e){
        if(e.value==0){
            console.log("Disable");
            $('#'+id+' option[value="'+e.key+'"]').attr('disabled','disabled');
        } else {
            $('#'+id+' option[value="'+e.key+'"]').removeAttr('disabled');
        } 
    });
}

function reduceAllFilters(){
    reduceFilter("regionDD",countByRegion.all());
    reduceFilter("orgDD",countByOrg.all());
    reduceFilter("sectorDD",countBySector.all());
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
    
    var overlay_prefectures = L.geoJson(prefectures,{
        onEachFeature:function(feature, layer) {
            layer.on('click', function (e) {
                byRegion_id.filterAll();
                byRegion.filterAll();
                byRegion_id.filter(e.target.feature.properties.ADM2_CODE);
                populateTable(byRegion.bottom(Infinity));  
                setRegionFilter(countByRegion.all());
                updateMap(countByRegion_id.all());
                reduceAllFilters();
            });
        }
    }).addTo(map);     
    
    overlay_prefectures.eachLayer(function (layer) {
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

createDropDown("#sector_filter","domainDD","Axes d'interventions",countBySector.all());

$("#domainDD").change(function() {
    if($(this).val()=="All"){
        bySector.filterAll();
    } else {
        bySector.filterAll();
        bySector.filter($(this).val());
    }
    populateTable(bySector.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

var byRegion = cf.dimension(function(d){return d.region;});
var countByRegion = byRegion.group();

createDropDown("#region_filter","regionDD","Préfecture",countByRegion.all());

$("#regionDD").change(function() {
    if($(this).val()=="All"){
        byRegion.filterAll();
        byRegion_id.filterAll();
    } else {
        byRegion.filterAll();
        byRegion_id.filterAll();
        byRegion.filter($(this).val());
    }
    populateTable(byRegion.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

var byOrg = cf.dimension(function(d){return d.org;});
var countByOrg = byOrg.group();

createDropDown("#org_filter","orgDD","Organisation",countByOrg.all());

$("#orgDD").change(function() {
    if($(this).val()=="All"){
        byOrg.filterAll();
    } else {
        byOrg.filterAll();
        byOrg.filter($(this).val());
    }
    populateTable(byOrg.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

var byRegion_id = cf.dimension(function(d){return d.region_id;});
var byRegion_id2 = cf.dimension(function(d){return d.region_id;});
var countByRegion_id = byRegion_id2.group();

populateTable(byRegion.bottom(Infinity));
initMap();
updateMap(countByRegion_id.all());