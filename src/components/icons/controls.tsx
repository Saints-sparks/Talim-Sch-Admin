/** Small interface controls: chevrons, search, power and the eye. */
import { iconClass, type IconClassProps } from "./iconTone";

export const ChevronRight = ({ className }: IconClassProps) => {
  return (
    <svg
      className={iconClass(className, "text-[#929292]")}
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.42505 14.6004L6.85838 9.16706C7.50005 8.52539 7.50005 7.47539 6.85838 6.83372L1.42505 1.40039"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronLeft = ({ className }: IconClassProps) => {
  return (
    <svg
      className={iconClass(className, "text-[#808080]")}
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.50003 1.39961L2.0667 6.83294C1.42503 7.47461 1.42503 8.52461 2.0667 9.16628L7.50003 14.5996"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronDown = ({ className }: IconClassProps) => {
  return (
    <svg
      className={iconClass(className, "text-[#898989]")}
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.4401 6.71203L10.5501 11.602C9.97256 12.1795 9.02756 12.1795 8.45006 11.602L3.56006 6.71203"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Search = ({ className }: IconClassProps) => {
  return (
    <svg
      className={iconClass(className, "text-[#B3B3B3]")}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5416 19.2497C15.3511 19.2497 19.2499 15.3508 19.2499 10.5413C19.2499 5.73186 15.3511 1.83301 10.5416 1.83301C5.73211 1.83301 1.83325 5.73186 1.83325 10.5413C1.83325 15.3508 5.73211 19.2497 10.5416 19.2497Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.1666 20.1663L18.3333 18.333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Power = ({ className }: IconClassProps) => {
  return (
    <svg
      className={iconClass(className, "text-[#929292]")}
      width="20"
      height="22"
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.3601 5.64C17.6185 6.89879 18.4754 8.50244 18.8224 10.2482C19.1694 11.9939 18.991 13.8034 18.3098 15.4478C17.6285 17.0921 16.4749 18.4976 14.9949 19.4864C13.515 20.4752 11.775 21.0029 9.99512 21.0029C8.21521 21.0029 6.47527 20.4752 4.99529 19.4864C3.51532 18.4976 2.36176 17.0921 1.68049 15.4478C0.999212 13.8034 0.82081 11.9939 1.16784 10.2482C1.51487 8.50244 2.37174 6.89879 3.63012 5.64M10.0001 1V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Eye = ({ className }: IconClassProps) => {
  return (
    <svg
      className={iconClass(className, "text-[#003366] dark:text-blue-300")}
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.1849 9.00043C12.1849 10.4854 10.9849 11.6854 9.49994 11.6854C8.01494 11.6854 6.81494 10.4854 6.81494 9.00043C6.81494 7.51543 8.01494 6.31543 9.49994 6.31543C10.9849 6.31543 12.1849 7.51543 12.1849 9.00043Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.49988 15.2025C12.1474 15.2025 14.6149 13.6425 16.3324 10.9425C17.0074 9.88504 17.0074 8.10754 16.3324 7.05004C14.6149 4.35004 12.1474 2.79004 9.49988 2.79004C6.85238 2.79004 4.38488 4.35004 2.66738 7.05004C1.99238 8.10754 1.99238 9.88504 2.66738 10.9425C4.38488 13.6425 6.85238 15.2025 9.49988 15.2025Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
