module.exports = function( $, THREE ) {

  "use strict";


  function SplineModel(){
    let scope = this;
    scope.getLevel = getLevel;
    scope.asJSON = asJSON;

    scope.MODE_EDIT = 0;
    scope.MODE_PLAY = 1;

    scope.ctrlPoints = [];
    scope.ctrlNormals = [];

    scope.mode = scope.MODE_EDIT;

    function asJSON(){
      var ctrlPointsArray = [];
      scope.ctrlPoints.forEach((vector)=>{
        ctrlPointsArray.push(vector.toArray());
      });

      var ctrlNormalsArray = [];
      scope.ctrlNormals.forEach((vector)=>{
        ctrlNormalsArray.push(vector.toArray());
      });
      var jsonData = {
        ctrlPoints: ctrlPointsArray,
        ctrlNormals: ctrlNormalsArray
      };
      return JSON.stringify(jsonData);
    }

    function getLevel(callback){
      $.getJSON('data/level01.json', (data)=>{

        data.ctrlPoints.forEach((point)=>{
          scope.ctrlPoints.push(
            new THREE.Vector3().fromArray(point)
          );
        });

        data.ctrlNormals.forEach((normal)=>{
          scope.ctrlNormals.push(
            new THREE.Vector3().fromArray(normal)
          );
        });

        callback();
      });
    }
  }

  return SplineModel;
};
