"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type CameraHandle = {
  takePhoto: () => string | null;
};

type NativeCameraProps = {
  facingMode?: "user" | "environment";
  aspectRatio?: number;
  errorMessages?: Partial<Record<"noCameraAccessible" | "permissionDenied" | "switchCamera" | "canvas", string>>;
};

export const Camera = forwardRef<CameraHandle, NativeCameraProps>(function NativeCamera(
  { facingMode = "user", aspectRatio = 4 / 3, errorMessages },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let activo = true;

    const iniciar = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });

        if (!activo) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        const permisoDenegado = error instanceof DOMException && error.name === "NotAllowedError";
        setMensajeError(
          permisoDenegado
            ? errorMessages?.permissionDenied || "No se concedió permiso para usar la cámara."
            : errorMessages?.noCameraAccessible || "No fue posible acceder a la cámara.",
        );
      }
    };

    void iniciar();

    return () => {
      activo = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode, errorMessages?.noCameraAccessible, errorMessages?.permissionDenied]);

  useImperativeHandle(ref, () => ({
    takePhoto: () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return null;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const contexto = canvas.getContext("2d");
      if (!contexto) return null;
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.9);
    },
  }));

  if (mensajeError) {
    return <div className="flex min-h-52 items-center justify-center bg-slate-900 p-6 text-center text-sm font-bold text-white">{mensajeError}</div>;
  }

  return (
    <div className="w-full overflow-hidden bg-black" style={{ aspectRatio }}>
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
    </div>
  );
});
