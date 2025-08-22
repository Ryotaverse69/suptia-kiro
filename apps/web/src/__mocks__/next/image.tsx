import * as React from "react";

type ImageSrc = string | { src: string };

type AllowedImgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src: ImageSrc;
  alt: string;
};

type NextOnlyProps = Partial<{
  priority: boolean;
  quality: number | string;
  placeholder: "blur" | "empty";
  blurDataURL: string;
  fill: boolean;
  unoptimized: boolean;
  onLoadingComplete: (img: HTMLImageElement) => void;
}>;

export type MockNextImageProps = AllowedImgProps & NextOnlyProps;

const MockNextImage = React.forwardRef<HTMLImageElement, MockNextImageProps>(
  (
    {
      priority,
      quality: _q,
      placeholder: _p,
      blurDataURL: _b,
      fill: _f,
      unoptimized: _u,
      onLoadingComplete: _olc,
      decoding = "async",
      loading: loadingProp,
      src,
      alt,
      ...imgProps
    },
    ref,
  ) => {
    const actualSrc =
      src && typeof src === "object" && "src" in src
        ? (src as { src: string }).src
        : (src as string);
    const loading = priority ? "eager" : loadingProp;

    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        ref={ref}
        src={actualSrc}
        alt={alt}
        decoding={decoding}
        loading={loading}
        {...imgProps}
      />
    );
  },
);

MockNextImage.displayName = "MockNextImage";
export default MockNextImage;
