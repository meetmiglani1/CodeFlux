import React, {
  useRef,
  useState
} from "react";

import {
  Upload,
  Camera,
  X,
  MapPin,
  FileText,
  ScanLine,
  CheckCircle2,
  Loader2
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  saveInspection
} from "../utils/storage";


function NewInspection() {

  const navigate = useNavigate();

  const fileRef = useRef(null);

  const [images, setImages] =
    useState([]);

  const [category, setCategory] =
    useState("Auto Detect");

  const [location, setLocation] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const [dragging, setDragging] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [stage, setStage] =
    useState(0);


  // --------------------------------
  // PROCESS SELECTED IMAGES
  // --------------------------------

  const processFiles = (files) => {

    const valid = Array.from(files || [])
      .filter((file) =>
        [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp"
        ].includes(file.type)
      );


    if (valid.length === 0) {
      alert(
        "Please select JPG, JPEG, PNG or WEBP images."
      );
      return;
    }


    valid.forEach((file) => {

      const reader =
        new FileReader();


      reader.onload = (e) => {

        setImages((prev) => [
          ...prev,

          {
            name: file.name,
            url: e.target.result,
            file
          }
        ]);

      };


      reader.readAsDataURL(file);

    });

  };


  // --------------------------------
  // REMOVE IMAGE
  // --------------------------------

  const removeImage = (index) => {

    setImages((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );

  };


  // --------------------------------
  // DRAG & DROP
  // --------------------------------

  const handleDrop = (e) => {

    e.preventDefault();

    setDragging(false);

    processFiles(
      e.dataTransfer.files
    );

  };


  // --------------------------------
  // RUN COMPLIANCE SCAN
  // --------------------------------

  const runScan = async () => {

    if (images.length === 0) {

      alert(
        "Please upload at least one product or label image."
      );

      return;
    }


    // Current FastAPI endpoint accepts
    // one image per scan.
    // We use the first selected image.

    const imageFile =
      images[0]?.file;


    if (!imageFile) {

      alert(
        "Could not access the selected image. Please upload it again."
      );

      return;
    }


    setScanning(true);

    setStage(0);


    let current = 0;


    const stageInterval =
      setInterval(() => {

        current += 1;

        setStage(current);


        if (current >= 4) {

          clearInterval(
            stageInterval
          );

        }

      }, 500);


    try {

      // --------------------------------
      // CREATE FORM DATA
      // --------------------------------

      const formData =
        new FormData();

      formData.append(
        "file",
        imageFile
      );


      // --------------------------------
      // FASTAPI REQUEST
      // --------------------------------

      const response =
        await fetch(
          "http://192.168.1.87:8000/check-compliance",
          {
            method: "POST",
            body: formData
          }
        );


      // --------------------------------
      // READ RESPONSE
      // --------------------------------

      let result;


      try {

        result =
          await response.json();

      } catch {

        throw new Error(
          "Backend returned an invalid response."
        );

      }


      // --------------------------------
      // CHECK API RESPONSE
      // --------------------------------

      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result?.detail ||
          "Compliance check failed."
        );

      }


      // --------------------------------
      // FINAL STAGE
      // --------------------------------

      setStage(5);


      // --------------------------------
      // CREATE INSPECTION ID
      // --------------------------------

      const scanId =
        result.scan?.scan_id;


      const inspectionId =
        scanId !== undefined &&
        scanId !== null
          ? `INS-${scanId}`
          : `INS-${Date.now()
              .toString()
              .slice(-6)}`;


      // --------------------------------
      // SAVE SCAN ID
      // --------------------------------

      if (
        scanId !== undefined &&
        scanId !== null
      ) {

        localStorage.setItem(
          "packsure_scan_id",
          String(scanId)
        );

      }


      // --------------------------------
      // CREATE INSPECTION OBJECT
      // --------------------------------

      const inspection = {

        id: inspectionId,

        scan_id: scanId,

        product:
          result.product?.product_name ||
          "Unknown Product",

        category:
          result.product?.category ||
          category ||
          "Auto Detect",

        date:
          new Date()
            .toISOString()
            .split("T")[0],

        score:
          result.compliance
            ?.compliance_score ?? 0,

        status:
          result.compliance
            ?.overall_status ||
          "UNKNOWN",

        risk_level:
          result.compliance
            ?.risk_level ||
          "UNKNOWN",

        location:
          location ||
          "Not specified",

        remarks

      };


      // --------------------------------
      // SAVE INSPECTION
      // --------------------------------

      saveInspection(
        inspection
      );


      // Give the scanning modal
      // a moment to show final stage.

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            400
          )
      );


      clearInterval(
        stageInterval
      );

      setScanning(false);


      // --------------------------------
      // GO TO REPORT
      // --------------------------------

      navigate(
        "/inspection/report",
        {
          state: {

            images,

            category:
              result.product?.category ||
              category,

            location,

            remarks,

            inspectionId,

            scanId,

            apiResult:
              result

          }
        }
      );


    } catch (error) {

      clearInterval(
        stageInterval
      );

      setScanning(false);


      console.error(
        "Compliance API error:",
        error
      );


      // --------------------------------
      // BACKEND ERROR MESSAGE
      // --------------------------------

      alert(
        `Could not connect to the compliance backend.

${error.message}

Make sure FastAPI is running on 192.168.1.87:8000.`
      );

    }

  };


  // --------------------------------
  // SCANNING STAGES
  // --------------------------------

  const stages = [

    "Image Processing",

    "OCR Text Recognition",

    "Information Extraction",

    "Rules Database Check",

    "Compliance Screening"

  ];


  // --------------------------------
  // UI
  // --------------------------------

  return (

    <div className="mx-auto max-w-6xl">


      {/* PAGE HEADER */}

      <div className="mb-8">

        <p
          className="
            text-xs
            font-bold
            uppercase
            tracking-widest
            text-blue-600
            dark:text-blue-400
          "
        >
          Inspection Center
        </p>


        <h1
          className="
            mt-2
            text-3xl
            font-black
          "
        >
          New Inspection
        </h1>


        <p
          className="
            mt-2
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Upload product or label images
          to start compliance screening.
        </p>

      </div>


      {/* IMAGE UPLOAD CARD */}

      <div
        className="
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          md:p-7
          dark:border-slate-800
          dark:bg-slate-900
        "
      >


        <div
          className="
            mb-6
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-blue-500/10
              text-blue-600
              dark:text-blue-400
            "
          >

            <ScanLine size={20} />

          </div>


          <div>

            <h2 className="font-bold">
              Product / Label Images
            </h2>


            <p
              className="
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              Upload front, back or multiple
              label images.
            </p>

          </div>

        </div>


        {/* DROP ZONE */}

        <div
          onDragOver={(e) => {

            e.preventDefault();

            setDragging(true);

          }}

          onDragLeave={() =>
            setDragging(false)
          }

          onDrop={handleDrop}

          className={`
            rounded-2xl
            border-2
            border-dashed
            p-8
            text-center
            transition

            ${
              dragging
                ? "border-blue-500 bg-blue-500/5"
                : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
            }
          `}
        >


          <Upload
            className="
              mx-auto
              text-slate-400
              dark:text-slate-500
            "
            size={35}
          />


          <h3
            className="
              mt-4
              font-bold
            "
          >
            Drag & drop product images
          </h3>


          <p
            className="
              mt-2
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            JPG, JPEG, PNG or WEBP
          </p>


          {/* BUTTONS */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              justify-center
              gap-3
            "
          >


            {/* BROWSE */}

            <button
              onClick={() =>
                fileRef.current?.click()
              }

              className="
                rounded-xl
                bg-blue-600
                px-5
                py-3
                text-sm
                font-bold
                text-white
                hover:bg-blue-500
              "
            >
              Browse Images
            </button>


            {/* CAMERA */}

            <label
              className="
                flex
                cursor-pointer
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                py-3
                text-sm
                font-bold
                hover:border-blue-500
                dark:border-slate-700
                dark:bg-slate-900
              "
            >

              <Camera size={17} />

              Take Photo


              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) =>
                  processFiles(
                    e.target.files
                  )
                }
              />

            </label>

          </div>


          {/* FILE INPUT */}

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="
              image/jpeg,
              image/jpg,
              image/png,
              image/webp
            "
            className="hidden"
            onChange={(e) =>
              processFiles(
                e.target.files
              )
            }
          />

        </div>


        {/* IMAGE PREVIEWS */}

        {images.length > 0 && (

          <div
            className="
              mt-5
              grid
              grid-cols-2
              gap-4
              sm:grid-cols-3
              md:grid-cols-4
            "
          >

            {images.map(
              (image, index) => (

                <div
                  key={`${image.name}-${index}`}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    dark:border-slate-700
                    dark:bg-slate-950
                  "
                >

                  <img
                    src={image.url}
                    alt={image.name}
                    className="
                      h-36
                      w-full
                      object-cover
                    "
                  />


                  <button
                    onClick={() =>
                      removeImage(index)
                    }

                    className="
                      absolute
                      right-2
                      top-2
                      rounded-lg
                      bg-black/70
                      p-1.5
                      text-white
                      transition
                      hover:bg-red-600
                    "
                  >

                    <X size={15} />

                  </button>


                  <div
                    className="
                      truncate
                      px-2
                      py-2
                      text-xs
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    {image.name}
                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* CATEGORY + LOCATION */}

      <div
        className="
          mt-5
          grid
          gap-5
          md:grid-cols-2
        "
      >


        {/* CATEGORY */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <label
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Product Category
          </label>


          <p
            className="
              mb-3
              text-xs
              text-slate-500
              dark:text-slate-400
            "
          >
            Auto Detect is recommended.
          </p>


          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }

            className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              focus:border-blue-500
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          >

            <option>
              Auto Detect
            </option>

            <option>
              Cosmetics
            </option>

            <option>
              Pharma
            </option>

            <option>
              Packaged Items
            </option>

            <option>
              Household
            </option>

            <option>
              Stationery
            </option>

            <option>
              Electronics
            </option>

          </select>

        </div>


        {/* LOCATION */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <label
            className="
              mb-2
              flex
              items-center
              gap-2
              text-sm
              font-bold
            "
          >

            <MapPin size={16} />

            Inspection Location

            <span
              className="
                text-xs
                text-slate-400
                dark:text-slate-600
              "
            >
              Optional
            </span>

          </label>


          <input
            value={location}
            onChange={(e) =>
              setLocation(
                e.target.value
              )
            }

            placeholder="e.g. Delhi"

            className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              placeholder:text-slate-400
              focus:border-blue-500
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
              dark:placeholder:text-slate-500
            "
          />

        </div>

      </div>


      {/* OFFICER REMARKS */}

      <div
        className="
          mt-5
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >

        <label
          className="
            mb-2
            flex
            items-center
            gap-2
            text-sm
            font-bold
          "
        >

          <FileText size={16} />

          Officer Remarks

          <span
            className="
              text-xs
              text-slate-400
              dark:text-slate-600
            "
          >
            Optional
          </span>

        </label>


        <textarea
          rows="4"
          value={remarks}
          onChange={(e) =>
            setRemarks(
              e.target.value
            )
          }

          placeholder="Add any inspection observations..."

          className="
            w-full
            resize-none
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
            text-sm
            text-slate-900
            outline-none
            placeholder:text-slate-400
            focus:border-blue-500
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
            dark:placeholder:text-slate-500
          "
        />

      </div>


      {/* SCAN BUTTON */}

      <div
        className="
          mt-6
          flex
          justify-end
        "
      >

        <button
          onClick={runScan}

          disabled={scanning}

          className="
            flex
            items-center
            gap-2
            rounded-xl
            bg-blue-600
            px-6
            py-3.5
            text-sm
            font-bold
            text-white
            shadow-lg
            shadow-blue-600/20
            transition
            hover:bg-blue-500
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          {scanning ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Scanning...
            </>
          ) : (
            <>
              <ScanLine size={18} />

              Scan & Check Compliance
            </>
          )}

        </button>

      </div>


      {/* SCANNING MODAL */}

      {scanning && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/80
            p-5
            backdrop-blur-sm
          "
        >

          <div
            className="
              w-full
              max-w-md
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-7
              text-slate-900
              shadow-2xl
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
            "
          >


            {/* LOADER */}

            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-blue-500/10
                text-blue-600
                dark:text-blue-400
              "
            >

              <Loader2
                size={27}
                className="animate-spin"
              />

            </div>


            <h2
              className="
                mt-5
                text-center
                text-xl
                font-black
              "
            >
              Screening Product
            </h2>


            <p
              className="
                mt-2
                text-center
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              PackSure AI is processing
              the uploaded label.
            </p>


            {/* STAGES */}

            <div
              className="
                mt-7
                space-y-4
              "
            >

              {stages.map(
                (item, index) => {

                  const completed =
                    stage > index;

                  const active =
                    stage === index;


                  return (

                    <div
                      key={item}
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >


                      <div
                        className={`
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-full

                          ${
                            completed
                              ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                              : active
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                          }
                        `}
                      >

                        {completed ? (

                          <CheckCircle2
                            size={16}
                          />

                        ) : active ? (

                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                        ) : (

                          index + 1

                        )}

                      </div>


                      <span
                        className={`
                          text-sm

                          ${
                            completed ||
                            active
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-400 dark:text-slate-600"
                          }
                        `}
                      >
                        {item}
                      </span>

                    </div>

                  );

                }
              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );
}


export default NewInspection;