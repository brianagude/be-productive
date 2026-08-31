import { type SVGProps, useId } from "react";

type Weight = "light" | "bold";
interface WeightedIconProps extends SVGProps<SVGSVGElement> {
  weight?: Weight;
}

const urgentPaths: Record<Weight, string> = {
  light: "M142,200a14,14,0,1,1-14-14A14,14,0,0,1,142,200Zm-14-42a6,6,0,0,0,6-6V48a6,6,0,0,0-12,0V152A6,6,0,0,0,128,158Z",
  bold: "M148,200a20,20,0,1,1-20-20A20,20,0,0,1,148,200Zm-20-40a12,12,0,0,0,12-12V48a12,12,0,0,0-24,0V148A12,12,0,0,0,128,160Z",
};

export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>List Icon</title>
      <path
        d="M15.4287 4.28564H5.143C4.19623 4.28564 3.42871 5.05316 3.42871 5.99993V21.4285C3.42871 22.3753 4.19623 23.1428 5.143 23.1428H15.4287C16.3755 23.1428 17.143 22.3753 17.143 21.4285V5.99993C17.143 5.05316 16.3755 4.28564 15.4287 4.28564Z"
        fill="var(--color-icon-fill)"
      />
      <path
        d="M15.4287 4.28564H5.143C4.19623 4.28564 3.42871 5.05316 3.42871 5.99993V21.4285C3.42871 22.3753 4.19623 23.1428 5.143 23.1428H15.4287C16.3755 23.1428 17.143 22.3753 17.143 21.4285V5.99993C17.143 5.05316 16.3755 4.28564 15.4287 4.28564Z"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.85742 8.57129H13.7146"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.85742 12.8569H13.7146"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.85742 17.1426H10.286"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.71436 0.856934H18.8572C19.3118 0.856934 19.748 1.03755 20.0694 1.35904C20.3908 1.68053 20.5715 2.11656 20.5715 2.57122V18.8569"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UrgentIcon({ weight = "light", ...props }: WeightedIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="var(--color-icon-stroke)" {...props}>
      <title>Urgent Icon</title>
      <path d={urgentPaths[weight]} />
    </svg>
  );
}

const checkPaths: Record<Weight, string> = {
  bold: "M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z",
  light: "M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z",
};

export function CheckIcon({ weight = "light", ...props }: WeightedIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="var(--color-icon-stroke)" {...props}>
      <title>Check Icon</title>
      <path d={checkPaths[weight]} />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Plus Icon</title>
      <g clipPath={`url(#${id})`}>
        <path
          d="M18 0.856934H6.00003C3.15972 0.856934 0.857178 3.15948 0.857178 5.99979V17.9998C0.857178 20.8402 3.15972 23.1426 6.00003 23.1426H18C20.8404 23.1426 23.1429 20.8402 23.1429 17.9998V5.99979C23.1429 3.15948 20.8404 0.856934 18 0.856934Z"
          fill="var(--color-icon-fill)"
        />
        <path
          d="M12 6.85693V17.1426"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.85718 12H17.1429"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 0.856934H6.00003C3.15972 0.856934 0.857178 3.15948 0.857178 5.99979V17.9998C0.857178 20.8402 3.15972 23.1426 6.00003 23.1426H18C20.8404 23.1426 23.1429 20.8402 23.1429 17.9998V5.99979C23.1429 3.15948 20.8404 0.856934 18 0.856934Z"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function TodayIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Today Icon</title>
      <g clipPath={`url(#${id})`}>
        <path
          d="M1.35928 22.6404C1.03779 22.319 0.857178 21.8829 0.857178 21.4282V9.42822H23.1429V21.4282C23.1429 21.8829 22.9622 22.319 22.6408 22.6404C22.3193 22.9618 21.8832 23.1425 21.4286 23.1425H2.57146C2.1168 23.1425 1.68077 22.9618 1.35928 22.6404Z"
          fill="var(--color-icon-fill)"
        />
        <path
          d="M1.35928 3.93032C1.68077 3.60884 2.1168 3.42822 2.57146 3.42822H21.4286C21.8832 3.42822 22.3193 3.60884 22.6408 3.93032C22.9622 4.25182 23.1429 4.68785 23.1429 5.14251V9.42822H0.857178V5.14251C0.857178 4.68785 1.03779 4.25182 1.35928 3.93032Z"
          fill="var(--color-icon-base)"
        />
        <path
          d="M2.57146 3.42822C2.1168 3.42822 1.68077 3.60884 1.35928 3.93032C1.03779 4.25182 0.857178 4.68785 0.857178 5.14251V21.4282C0.857178 21.8829 1.03779 22.319 1.35928 22.6404C1.68077 22.9618 2.1168 23.1425 2.57146 23.1425H21.4286C21.8832 23.1425 22.3193 22.9618 22.6408 22.6404C22.9622 22.319 23.1429 21.8829 23.1429 21.4282V5.14251C23.1429 4.68785 22.9622 4.25182 22.6408 3.93032C22.3193 3.60884 21.8832 3.42822 21.4286 3.42822H18"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0.857178 9.42822H23.1429"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 0.856934V5.99979"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 0.856934V5.99979"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 3.42822H14.5714"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function YearIcon(props: SVGProps<SVGSVGElement>) {
  const clipId = useId();
  const maskId = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Year Icon</title>
      <g clipPath={`url(#${clipId})`}>
        <mask
          id={maskId}
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <path d="M24 0H0V24H24V0Z" fill="white" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M1.35928 22.6409C1.03779 22.3195 0.857178 21.8833 0.857178 21.4287V9.42871H23.1429V21.4287C23.1429 21.8833 22.9622 22.3195 22.6408 22.6409C22.3193 22.9623 21.8832 23.143 21.4286 23.143H2.57146C2.1168 23.143 1.68077 22.9623 1.35928 22.6409Z"
            fill="var(--color-icon-fill)"
          />
          <path
            d="M1.35928 3.93081C1.68077 3.60933 2.1168 3.42871 2.57146 3.42871H21.4286C21.8832 3.42871 22.3193 3.60933 22.6408 3.93081C22.9622 4.25231 23.1429 4.68833 23.1429 5.143V9.42871H0.857178V5.143C0.857178 4.68833 1.03779 4.25231 1.35928 3.93081Z"
            fill="var(--color-icon-base)"
          />
          <path
            d="M2.57146 3.42871C2.1168 3.42871 1.68077 3.60933 1.35928 3.93081C1.03779 4.25231 0.857178 4.68833 0.857178 5.143V21.4287C0.857178 21.8833 1.03779 22.3195 1.35928 22.6409C1.68077 22.9623 2.1168 23.143 2.57146 23.143H21.4286C21.8832 23.143 22.3193 22.9623 22.6408 22.6409C22.9622 22.3195 23.1429 21.8833 23.1429 21.4287V5.143C23.1429 4.68833 22.9622 4.25231 22.6408 3.93081C22.3193 3.60933 21.8832 3.42871 21.4286 3.42871H18"
            stroke="var(--color-icon-stroke)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M0.857178 9.42871H23.1429"
            stroke="var(--color-icon-stroke)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 0.857422V6.00027"
            stroke="var(--color-icon-stroke)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 0.857422V6.00027"
            stroke="var(--color-icon-stroke)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 3.42871H14.5714"
            stroke="var(--color-icon-stroke)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 15C6.55228 15 7 14.5523 7 14C7 13.4477 6.55228 13 6 13C5.44772 13 5 13.4477 5 14C5 14.5523 5.44772 15 6 15Z"
            fill="var(--color-icon-stroke)"
          />
          <path
            d="M12 15C12.5523 15 13 14.5523 13 14C13 13.4477 12.5523 13 12 13C11.4477 13 11 13.4477 11 14C11 14.5523 11.4477 15 12 15Z"
            fill="var(--color-icon-stroke)"
          />
          <path
            d="M18 15C18.5523 15 19 14.5523 19 14C19 13.4477 18.5523 13 18 13C17.4477 13 17 13.4477 17 14C17 14.5523 17.4477 15 18 15Z"
            fill="var(--color-icon-stroke)"
          />
          <path
            d="M6 20C6.55228 20 7 19.5523 7 19C7 18.4477 6.55228 18 6 18C5.44772 18 5 18.4477 5 19C5 19.5523 5.44772 20 6 20Z"
            fill="var(--color-icon-stroke)"
          />
          <path
            d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
            fill="var(--color-icon-stroke)"
          />
          <path
            d="M18 20C18.5523 20 19 19.5523 19 19C19 18.4477 18.5523 18 18 18C17.4477 18 17 18.4477 17 19C17 19.5523 17.4477 20 18 20Z"
            fill="var(--color-icon-stroke)"
          />
        </g>
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function TimerIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Timer Icon</title>
      <g clipPath={`url(#${id})`}>
        <path
          d="M12.0001 23.1428C17.2074 23.1428 21.4287 18.9215 21.4287 13.7142C21.4287 8.50695 17.2074 4.28564 12.0001 4.28564C6.79284 4.28564 2.57153 8.50695 2.57153 13.7142C2.57153 18.9215 6.79284 23.1428 12.0001 23.1428Z"
          fill="var(--color-icon-fill)"
        />
        <path
          d="M12.0001 23.1428C17.2074 23.1428 21.4287 18.9215 21.4287 13.7142C21.4287 8.50695 17.2074 4.28564 12.0001 4.28564C6.79284 4.28564 2.57153 8.50695 2.57153 13.7142C2.57153 18.9215 6.79284 23.1428 12.0001 23.1428Z"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0.857178 4.28551C2.06109 2.88708 3.5143 1.7245 5.14289 0.856934"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.1429 4.28551C21.9389 2.88708 20.4857 1.7245 18.8572 0.856934"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.57129V13.7141H16.2857"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function ArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Archive Icon</title>
      <path
        d="M2.57153 8.57129H21.4287V20.5713C21.4287 21.0259 21.248 21.462 20.9266 21.7835C20.6051 22.1049 20.169 22.2856 19.7144 22.2856H4.28582C3.83116 22.2856 3.39513 22.1049 3.07363 21.7835C2.75215 21.462 2.57153 21.0259 2.57153 20.5713V8.57129Z"
        fill="var(--color-icon-fill)"
      />
      <path
        d="M23.1429 6.85721V3.42864C23.1429 2.48188 22.3754 1.71436 21.4286 1.71436H2.57146C1.62469 1.71436 0.857178 2.48188 0.857178 3.42864V6.85721C0.857178 7.80398 1.62469 8.5715 2.57146 8.5715H21.4286C22.3754 8.5715 23.1429 7.80398 23.1429 6.85721Z"
        fill="var(--color-icon-fill)"
      />
      <path
        d="M2.57153 8.57129H21.4287V20.5713C21.4287 21.0259 21.248 21.462 20.9266 21.7835C20.6051 22.1049 20.169 22.2856 19.7144 22.2856H4.28582C3.83116 22.2856 3.39513 22.1049 3.07363 21.7835C2.75215 21.462 2.57153 21.0259 2.57153 20.5713V8.57129Z"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.1429 6.85721V3.42864C23.1429 2.48188 22.3754 1.71436 21.4286 1.71436H2.57146C1.62469 1.71436 0.857178 2.48188 0.857178 3.42864V6.85721C0.857178 7.80398 1.62469 8.5715 2.57146 8.5715H21.4286C22.3754 8.5715 23.1429 7.80398 23.1429 6.85721Z"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.42871 13.7144H14.5716"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Account Icon</title>
      <g clipPath={`url(#${id})`}>
        <path
          d="M12.0001 13.714C14.367 13.714 16.2858 11.7952 16.2858 9.42829C16.2858 7.06136 14.367 5.14258 12.0001 5.14258C9.63314 5.14258 7.71436 7.06136 7.71436 9.42829C7.71436 11.7952 9.63314 13.714 12.0001 13.714Z"
          fill="var(--color-icon-base)"
        />
        <path
          d="M19.3223 20.3992C17.3641 22.1079 14.8029 23.1428 11.9999 23.1428C9.19696 23.1428 6.63572 22.1079 4.67749 20.3992C6.18246 17.9324 8.89887 16.2856 11.9999 16.2856C15.101 16.2856 17.8174 17.9324 19.3223 20.3992Z"
          fill="var(--color-icon-base)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.67758 20.3991C6.18255 17.9322 8.89898 16.2855 12 16.2855C15.1011 16.2855 17.8175 17.9322 19.3224 20.3991C21.6636 18.3564 23.1429 15.3509 23.1429 11.9998C23.1429 5.84576 18.1541 0.856934 12 0.856934C5.84601 0.856934 0.857178 5.84576 0.857178 11.9998C0.857178 15.3509 2.33643 18.3564 4.67758 20.3991ZM12 13.7141C14.367 13.7141 16.2857 11.7953 16.2857 9.42836C16.2857 7.06143 14.367 5.14265 12 5.14265C9.6331 5.14265 7.71432 7.06143 7.71432 9.42836C7.71432 11.7953 9.6331 13.7141 12 13.7141Z"
          fill="var(--color-icon-fill)"
        />
        <path
          d="M12.0001 13.714C14.367 13.714 16.2858 11.7952 16.2858 9.42829C16.2858 7.06136 14.367 5.14258 12.0001 5.14258C9.63314 5.14258 7.71436 7.06136 7.71436 9.42829C7.71436 11.7952 9.63314 13.714 12.0001 13.714Z"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.67993 20.3996C5.44491 19.1438 6.52006 18.106 7.80201 17.386C9.08395 16.6658 10.5296 16.2876 11.9999 16.2876C13.4703 16.2876 14.9159 16.6658 16.1979 17.386C17.4799 18.106 18.5549 19.1438 19.32 20.3996"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 23.1426C18.1541 23.1426 23.1429 18.1539 23.1429 11.9998C23.1429 5.84576 18.1541 0.856934 12 0.856934C5.84601 0.856934 0.857178 5.84576 0.857178 11.9998C0.857178 18.1539 5.84601 23.1426 12 23.1426Z"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function PaintbrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Paintbrush Icon</title>
      <path
        d="M19.7145 14.5713H4.28589L2.98303 21.0856C2.93395 21.3347 2.94079 21.5915 3.00306 21.8375C3.06532 22.0835 3.18143 22.3127 3.34303 22.5084C3.50255 22.7051 3.70365 22.864 3.93189 22.9737C4.16011 23.0832 4.40982 23.141 4.66303 23.1427H19.3373C19.5905 23.141 19.8403 23.0832 20.0685 22.9737C20.2966 22.864 20.4977 22.7051 20.6573 22.5084C20.819 22.3127 20.935 22.0835 20.9973 21.8375C21.0595 21.5915 21.0663 21.3347 21.0173 21.0856L19.7145 14.5713Z"
        fill="var(--color-icon-base)"
      />
      <path
        d="M19.7145 14.5713H4.28589L2.98303 21.0856C2.93395 21.3347 2.94079 21.5915 3.00306 21.8375C3.06532 22.0835 3.18143 22.3127 3.34303 22.5084C3.50255 22.7051 3.70365 22.864 3.93189 22.9737C4.16011 23.0832 4.40982 23.141 4.66303 23.1427H19.3373C19.5905 23.141 19.8403 23.0832 20.0685 22.9737C20.2966 22.864 20.4977 22.7051 20.6573 22.5084C20.819 22.3127 20.935 22.0835 20.9973 21.8375C21.0595 21.5915 21.0663 21.3347 21.0173 21.0856L19.7145 14.5713Z"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.7144 9.42836C20.169 9.42836 20.6051 9.60898 20.9266 9.93046C21.248 10.252 21.4287 10.688 21.4287 11.1426V14.5712H2.57153V11.1426C2.57153 10.688 2.75215 10.252 3.07363 9.93046C3.39513 9.60898 3.83116 9.42836 4.28582 9.42836H6.85725C7.31191 9.42836 7.74794 9.24774 8.06944 8.92626C8.39092 8.60477 8.57153 8.16874 8.57153 7.71408V4.28551C8.57153 3.3762 8.93275 2.50412 9.57574 1.86115C10.2187 1.21816 11.0908 0.856934 12.0001 0.856934C12.9094 0.856934 13.7815 1.21816 14.4245 1.86115C15.0675 2.50412 15.4287 3.3762 15.4287 4.28551V7.71408C15.4287 8.16874 15.6093 8.60477 15.9308 8.92626C16.2523 9.24774 16.6883 9.42836 17.143 9.42836H19.7144Z"
        fill="var(--color-icon-fill)"
      />
      <path
        d="M19.7144 9.42836C20.169 9.42836 20.6051 9.60898 20.9266 9.93046C21.248 10.252 21.4287 10.688 21.4287 11.1426V14.5712H2.57153V11.1426C2.57153 10.688 2.75215 10.252 3.07363 9.93046C3.39513 9.60898 3.83116 9.42836 4.28582 9.42836H6.85725C7.31191 9.42836 7.74794 9.24774 8.06944 8.92626C8.39092 8.60477 8.57153 8.16874 8.57153 7.71408V4.28551C8.57153 3.3762 8.93275 2.50412 9.57574 1.86115C10.2187 1.21816 11.0908 0.856934 12.0001 0.856934C12.9094 0.856934 13.7815 1.21816 14.4245 1.86115C15.0675 2.50412 15.4287 3.3762 15.4287 4.28551V7.71408C15.4287 8.16874 15.6093 8.60477 15.9308 8.92626C16.2523 9.24774 16.6883 9.42836 17.143 9.42836H19.7144Z"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5715 23.1426V18.8569"
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HelpIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Help Icon</title>
      <g clipPath={`url(#${id})`}>
        <path
          d="M12 23.1426C18.1541 23.1426 23.1429 18.1539 23.1429 11.9998C23.1429 5.84576 18.1541 0.856934 12 0.856934C5.84601 0.856934 0.857178 5.84576 0.857178 11.9998C0.857178 18.1539 5.84601 23.1426 12 23.1426Z"
          fill="var(--color-icon-fill)"
        />
        <path
          d="M12 23.1426C18.1541 23.1426 23.1429 18.1539 23.1429 11.9998C23.1429 5.84576 18.1541 0.856934 12 0.856934C5.84601 0.856934 0.857178 5.84576 0.857178 11.9998C0.857178 18.1539 5.84601 23.1426 12 23.1426Z"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 8.9995C9 8.40615 9.17611 7.82614 9.50606 7.33279C9.83599 6.83945 10.305 6.45494 10.8536 6.22788C11.4023 6.00081 12.0061 5.94141 12.5885 6.05715C13.171 6.17292 13.706 6.45864 14.126 6.87819C14.5459 7.29775 14.8319 7.8323 14.9478 8.41423C15.0636 8.99618 15.0042 9.59937 14.7769 10.1475C14.5496 10.6957 14.1647 11.1643 13.6709 11.4939C13.1772 11.8235 12.5966 11.9995 12.0027 11.9995V13.9995"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.0001 17.9284C11.7634 17.9284 11.5715 17.7366 11.5715 17.4999C11.5715 17.2631 11.7634 17.0713 12.0001 17.0713"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 17.9284C12.2367 17.9284 12.4286 17.7366 12.4286 17.4999C12.4286 17.2631 12.2367 17.0713 12 17.0713"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function FanIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Fan Icon</title>
      <g clipPath={`url(#${id})`}>
        <path
          d="M12.8058 11.8285C12.5515 11.9389 12.2773 11.9959 12.0001 11.9959C11.7229 11.9959 11.4486 11.9389 11.1944 11.8285L1.42294 7.30276C1.26427 7.22272 1.13092 7.10021 1.03776 6.94888C0.944594 6.79756 0.895264 6.62332 0.895264 6.44561C0.895264 6.26789 0.944594 6.09367 1.03776 5.94233C1.13092 5.791 1.26427 5.66849 1.42294 5.58847L11.1944 1.02847C11.4486 0.918058 11.7229 0.861084 12.0001 0.861084C12.2773 0.861084 12.5515 0.918058 12.8058 1.02847L22.5772 5.55419C22.736 5.63421 22.8692 5.75671 22.9624 5.90805C23.0555 6.05939 23.1049 6.23361 23.1049 6.41133C23.1049 6.58903 23.0555 6.76327 22.9624 6.91459C22.8692 7.06593 22.736 7.18843 22.5772 7.26847L12.8058 11.8285Z"
          fill="var(--color-icon-fill)"
        />
        <path
          d="M12.8058 11.8285C12.5515 11.9389 12.2773 11.9959 12.0001 11.9959C11.7229 11.9959 11.4486 11.9389 11.1944 11.8285L1.42294 7.30275C1.26427 7.22273 1.13092 7.10023 1.03776 6.94889C0.944594 6.79755 0.895264 6.62333 0.895264 6.44561C0.895264 6.26789 0.944594 6.09367 1.03776 5.94233C1.13092 5.79101 1.26427 5.66851 1.42294 5.58847L11.1944 1.02847C11.4486 0.918058 11.7229 0.861084 12.0001 0.861084C12.2773 0.861084 12.5515 0.918058 12.8058 1.02847L22.5772 5.55418C22.736 5.63422 22.8692 5.75673 22.9624 5.90805C23.0555 6.05938 23.1049 6.23361 23.1049 6.41133C23.1049 6.58905 23.0555 6.76327 22.9624 6.91461C22.8692 7.06594 22.736 7.18845 22.5772 7.26847L12.8058 11.8285Z"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.1429 12.5999L12.6857 17.417C12.4624 17.5188 12.2198 17.5716 11.9743 17.5716C11.7289 17.5716 11.4862 17.5188 11.2629 17.417L0.857178 12.5999"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.1429 18.1714L12.6857 22.9885C12.4624 23.0904 12.2198 23.1432 11.9743 23.1432C11.7289 23.1432 11.4862 23.0904 11.2629 22.9885L0.857178 18.1714"
          stroke="var(--color-icon-stroke)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Trash Icon</title>
      <g
        stroke="var(--color-icon-stroke)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M5.14282 6.42859L6.13425 19.7143C6.13425 20.2039 6.32877 20.6735 6.67509 21.0198C7.0214 21.3661 7.49096 21.5606 7.98068 21.5606H16.0192C16.5089 21.5606 16.9785 21.3661 17.3248 21.0198C17.6711 20.6735 17.8656 20.2039 17.8656 19.7143L18.8571 6.42859"
          fill="var(--color-icon-fill)"
        />
        <path d="M3.42859 6.42859H20.5714" />
        <path d="M9.42859 10.7143V16.7143" />
        <path d="M14.5714 10.7143V16.7143" />
        <path d="M8.57145 6.42859V3.85716C8.57145 3.62982 8.66176 3.41181 8.8225 3.25107C8.98325 3.09032 9.20125 3.00002 9.4286 3.00002H14.5714C14.7988 3.00002 15.0168 3.09032 15.1775 3.25107C15.3383 3.41181 15.4286 3.62982 15.4286 3.85716V6.42859" />
      </g>
    </svg>
  );
}
