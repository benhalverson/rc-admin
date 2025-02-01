import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  WMLThreeCommonProps,
  WMLThreeLightProps,
} from '@windmillcode/wml-three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { AmbientLight, Color, Mesh, MeshPhongMaterial, Vector3 } from 'three';
import { Subject, of } from 'rxjs';
import { tap, takeUntil, catchError } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-product-details',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent {
  productForm: FormGroup;
  productDetails = {
    name: 'Sample Product',
    description: 'This is a sample product.',
    filamentType: 'PLA',
    stl: 'https://pub-0ec69c7d5c064de8b57f5d594f07bc02.r2.dev/6_hole_gear_v5_upload.stl', // Default STL file
  };
  isEditing = false;
  private destroy$ = new Subject<void>();

  @ViewChild('renderer', { read: ViewContainerRef, static: true })
  renderer!: ViewContainerRef;
  private three!: WMLThreeCommonProps;

  constructor(
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {
    this.productForm = this.fb.group({
      name: [
        this.productDetails.name,
        [Validators.required, Validators.maxLength(100)],
      ],
      description: [this.productDetails.description, Validators.required],
      filamentType: [this.productDetails.filamentType],
      stl: [this.productDetails.stl, Validators.required],
    });
  }

  ngOnInit(): void {
    this.initializeRenderer();

    // Load the initial STL file
    this.loadSTLModel(this.productDetails.stl);

    // Watch for changes in the STL URL field and reload the viewer
    this.productForm.get('stl')?.valueChanges
      .pipe(
        tap((url) => {
          this.loadSTLModel(url);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  saveChanges(): void {
    if (this.productForm.invalid) {
      this.toastr.warning('Please fix the errors in the form.');
      return;
    }

    // Update the product details and toggle editing mode
    this.productDetails = { ...this.productForm.value };
    this.isEditing = false;
    this.toastr.success('Product details updated successfully!');
  }

  private initializeRenderer(): void {
    // Initialize the Three.js renderer using the WMLThreeCommonProps
    this.three = new WMLThreeCommonProps({
      rendererParentElement: this.renderer.element.nativeElement,
      objects: [],
      lights: [
        new WMLThreeLightProps({
          light: new AmbientLight(0xffffff, 10),
        }),
      ],
    });

    this.three.init();
    this.three.updateCameraPosition({
      position: new Vector3(-60, 20, -20),
      updateControls: true,
    });
  }

  private loadSTLModel(url: string): void {
    if (!url) {
      this.toastr.warning('Please provide a valid STL URL.');
      return;
    }

    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        try {
          const material = new MeshPhongMaterial({
            color: new Color(0xaa3333),
          });
          const mesh = new Mesh(geometry, material);

          // Scale the geometry if necessary
          if (geometry.boundingBox) {
            const size = new Vector3();
            geometry.boundingBox.getSize(size);
            const maxSize = Math.max(size.x, size.y, size.z);
            if (maxSize > 100) {
              mesh.scale.set(0.1, 0.1, 0.1); // Scale down large models
            } else if (maxSize < 1) {
              mesh.scale.set(10, 10, 10); // Scale up small models
            }
          }

          // Clear the current scene and add the new mesh
          const scene = this.three.getCurentScene();
          scene.clear();
          scene.add(mesh);

          // Render the updated scene
          this.three.renderer();
        } catch (error) {
          this.toastr.error('Failed to load the STL model.');
          console.error('Error rendering STL model:', error);
        }
      },
      undefined,
      (error) => {
        this.toastr.error('Error loading STL file.');
        console.error('Error loading STL file:', error);
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
