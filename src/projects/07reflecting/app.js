import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js'
import { threeFresnelShader } from '../../js/shaders/FresnelShader.js'

class App{
	constructor(){
    this.init()
    this.createContent()

    this.renderer.setAnimationLoop(this.render.bind(this))
    window.addEventListener('resize', this.resize.bind(this) );
	}	


  init(){
    this.setThreeElements()
    this.setArElements()
  }


  /**
   * Three.js 환경 생성 */ 
  setThreeElements() {

    // renderer : 나의 데이터를 실제로 그려주는 역할
    const container = document.createElement( 'div' );
    document.body.appendChild( container );
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setSize(window.innerHeight, window.innerWidth)
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0px'
    this.renderer.domElement.style.left = '0px'
    container.appendChild(this.renderer.domElement)

    // camera : 시야각, 캔버스배율, 랜더링 공간설정
		this.camera = new THREE.Camera();
    
    // scene : 최상위 노드(객체)로서 배경색 안개등을 트리안의 모든 방향성은 scene으로 부터 결정된다.
    this.scene = new THREE.Scene() 
    this.scene.add(this.camera)
    
  }


  /**
   * arToolkit plugin for three.js (main part of ar.js) */ 
  setArElements() {

    // ##### arToolkitSource :위치를 추적하고 분석된 이미지. 현재는 카메라에 비춰진 모습 
    this.arToolkitSource = new THREEx.ArToolkitSource({ sourceType: 'webcam'})
    this.arToolkitSource.init(() => { setTimeout(() => { this.resize() }, 500) })

    // ##### arToolkitContext : 이미지(arToolkitSource)안에 있는 마커를 찾는 메인엔진 */ 
    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../../../data/camera_para.dat',
      detectionMode: 'mono',
    })

    this.arToolkitContext.init(() => {
      // copy projection matrix to camera
      this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix())
    })

    this.markerRoot = new THREE.Group();
    this.scene.add(this.markerRoot);

    // ##### arToolkitControl :카메라와 마커의 포지션을 조정하거나 마커위에 컨텐츠를 고정
    this.markerControls = new THREEx.ArMarkerControls(
      this.arToolkitContext,
      this.markerRoot,
      {
        type: 'pattern',
        patternUrl: THREEx.ArToolkitContext.baseURL + '../../../data/marker/patt.hiro',
      },
    )
  }


  /**
   * add an object in the scene */
  createContent() {
    const ambientLight = new THREE.AmbientLight(0xd87e88)
    this.markerRoot.add(ambientLight)

    const light1 = new THREE.PointLight()
    light1.position.set(0, 0, 0)
    light1.castShadow = true
    light1.shadow.bias = -0.0002
    light1.shadow.mapSize.height = 1024
    light1.shadow.mapSize.width = 1024
    this.scene.add(light1)

    let cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 128, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    } );


    this.cubeCamera = new THREE.CubeCamera( 0.1, 10, cubeRenderTarget );
    this.markerRoot.add(this.cubeCamera)
  
    const material = new THREE.MeshPhongMaterial({
      shininess: 100,
      color: 0xffffff,
      specular: 0xffaa00,
      reflectivity: .2,
      envMap: cubeRenderTarget.texture
    })


    const geometry = new THREE.TorusGeometry( 10, 2.9, 4, 100 )


    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = .5
    this.mesh.scale.set(0.1,0.1,0.1)
    this.mesh.rotation.x = -Math.PI/2;


    const axes = new THREE.AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 1;

    this.markerRoot.add(axes)

    this.markerRoot.add(this.mesh)

    this.mesh.visible = false;
    this.cubeCamera.position.copy( this.mesh.position );
    this.cubeCamera.update( this.renderer, this.markerRoot );

  }


	render() {   
    if (this.arToolkitSource.ready === false) return
    // 엔진이 계속 이미지영역을 계속 감지해야함.
    this.arToolkitContext.update(this.arToolkitSource.domElement)
    // update scene.visible if the marker is seen
    this.scene.visible = this.camera.visible


    this.mesh.visible = true
    this.renderer.render(this.scene, this.camera)
  }


  resize() {
    this.arToolkitSource.onResizeElement()
    this.arToolkitSource.copyElementSizeTo(this.renderer.domElement)
    if (this.arToolkitContext.arController !== null) {
      this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas,)
    }
  }
  
}

export { App };