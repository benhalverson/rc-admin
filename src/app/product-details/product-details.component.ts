import { Component, Inject, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { ProductResponse, ProductService } from '../product.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { catchError, of, Subject, switchMap, takeUntil, tap, timer } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  WMLThreeCommonObjectProps,
  WMLThreeCommonProps,
  WMLThreeLightProps,
  WMLThreeTexturesProps,
} from '@windmillcode/wml-three';
import {
  BoxGeometry,
  Vector3,
  Color,
  AmbientLight,
  MeshStandardMaterial,
  TextureLoader,
  SphereGeometry,
  EquirectangularReflectionMapping,
  MeshPhysicalMaterial,
  Mesh,
  MeshPhongMaterial,
} from 'three';
import { generateRandomColor } from '@windmillcode/wml-components-base';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';




@Component({
  selector: 'app-product-details',
  imports: [ReactiveFormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent {

  productForm: FormGroup;
  productDetails = {} as ProductResponse;
  editableDetails = {} as ProductResponse;
  isEditing = false;
  private destroy$ = new Subject<void>();

  @ViewChild('renderer', { read: ViewContainerRef, static: true })
  renderer!: ViewContainerRef;
  ngUnsub = new Subject<void>();
  three!: WMLThreeCommonProps;
  threeOne!: WMLThreeCommonProps;
  threeTwo!: WMLThreeCommonProps;
  threeThree!: WMLThreeCommonProps;
  threeFour!: WMLThreeCommonProps;

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService,
  ) {
    this.productForm = this.fb.group({
      name: [''],
      description: ['',],
      filamentType: [''],
    });
  }

  createRenderer(three: WMLThreeCommonProps) {
    three.init();
    three.updateCameraPosition({
      position: new Vector3(-60, 20, -20),
      updateControls: true,
    });
  }

  ngOnInit() {

 timer(2000)
      .pipe(
        tap(() => {
          [
            this.renderer,
            // this.rendererTwo,
            // this.rendererThree,
            // this.rendererFour,
            // this.rendererFive,
          ].forEach((renderer, index0) => {
            let model = new WMLThreeCommonObjectProps({
              geometry: new BoxGeometry(12, 12, 12),
              material: new MeshStandardMaterial({
                color: new Color(generateRandomColor()),
              }),
            });
            let sphere = new WMLThreeCommonObjectProps({
              geometry: new SphereGeometry(12, 30, 30),
              material: new MeshPhysicalMaterial({
                roughness: 0.5,
                metalness: 0.7,
                color: 0xaa0000,
                transmission: 0.5, // Makes the material fully transparent, allowing light to pass through like glass.
                ior: 2.33, // Index of refraction
              }),
            });

            if (index0 === 0) {
              model = new WMLThreeCommonObjectProps({
                texture: new WMLThreeTexturesProps({
                  group: [
                    {
                      url: 'https://pub-0ec69c7d5c064de8b57f5d594f07bc02.r2.dev/6_hole_gear_v5_upload.stl',
                      loader: new STLLoader(),
                      onLoad: (geometry) => {
                        try {
                          const scene = three.getCurentScene();
                          // Default material
                          let material = new MeshPhongMaterial({
                            color: 0xaa3333,
                          });

                          // Handle geometries with vertex colors
                          if (geometry.hasColors) {
                            material = new MeshPhongMaterial({
                              opacity: geometry.alpha || 1,
                              vertexColors: true,
                              transparent: geometry.alpha < 1, // Enable transparency if alpha is less than 1
                            });
                          }

                          // Handle multiple solids in ASCII STLs
                          let mesh;
                          if (geometry.groups?.length > 0) {
                            const materials = geometry.groups.map(
                              (group, index) => {
                                return new MeshPhongMaterial({
                                  color: new Color(
                                    `hsl(${
                                      (index / geometry.groups.length) * 360
                                    }, 100%, 50%)`
                                  ),
                                  wireframe: false,
                                });
                              }
                            );

                            mesh = new Mesh(geometry, materials);
                          } else {
                            // Single solid or binary STL
                            mesh = new Mesh(geometry, material);
                          }

                          // Optional scaling for large or small geometries
                          if (geometry.boundingBox) {
                            const size = new Vector3();
                            geometry.boundingBox.getSize(size);
                            if (size.length() > 100) {
                              console.warn('Geometry is large, scaling down.');
                              mesh.scale.set(0.1, 0.1, 0.1);
                            } else if (size.length() < 1) {
                              console.warn('Geometry is small, scaling up.');
                              mesh.scale.set(10, 10, 10);
                            }
                          } else {
                            console.warn(
                              'No bounding box detected; scaling skipped.'
                            );
                          }

                          // Add mesh to the scene
                          scene.add(mesh);
                        } catch (error) {
                          console.error('Error handling STL geometry:', error);
                        }
                      },

                      onError: (err) => {
                        console.log(err);
                      },
                    },
                  ],
                }),
              });
            }
            let three = new WMLThreeCommonProps({
              rendererParentElement: renderer.element.nativeElement,
              objects: [model],
              lights: [
                new WMLThreeLightProps({
                  light: new AmbientLight(0xffffff, 10),
                }),
              ],
            });
            if (index0 === 3) {
              three.objects.push(sphere);
            }

            this.createRenderer(three);
          });
        })
      )
      .subscribe();



    this.route.params
      .pipe(
        switchMap((params: Params) =>
          this.productService.getProductById(params['id'])
        ),
        tap((product) => {
          this.productDetails = product;
          this.productForm.patchValue(product);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  saveChanges() {
    if (this.productForm.invalid) {
      return;
    }

    const updatedProduct: ProductResponse = {
      ...this.productDetails,
      ...this.productForm.value,
    };

    this.productService
      .updateProduct(updatedProduct)
      .pipe(
        tap(() => {
          this.productDetails = updatedProduct;
          this.isEditing = false;
          this.toastr.success('Product updated successfully');
          this.router.navigate(['/products']);
        }),
        catchError((error) => {
          this.toastr.error('Error updating product');
          // this.router.navigate(['/']);
          return of(error);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
