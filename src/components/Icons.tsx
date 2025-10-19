interface IconProps {
  stroke?: string;
  isActive?: boolean;
}

export const Calendar = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2V5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 2V5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 9.08984H20.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6947 13.6992H15.7037"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6947 16.6992H15.7037"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9955 13.6992H12.0045"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9955 16.6992H12.0045"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.29431 13.6992H8.30329"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.29431 16.6992H8.30329"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const UserGroup = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_14279_57161)">
        <path
          d="M12.5 10C14.7091 10 16.5 8.20914 16.5 6C16.5 3.79086 14.7091 2 12.5 2C10.2909 2 8.5 3.79086 8.5 6C8.5 8.20914 10.2909 10 12.5 10Z"
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        <path
          d="M18.5 9C20.157 9 21.5 7.88 21.5 6.5C21.5 5.12 20.157 4 18.5 4M6.5 9C4.843 9 3.5 7.88 3.5 6.5C3.5 5.12 4.843 4 6.5 4M17.697 15C18.207 15.588 18.5 16.271 18.5 17C18.5 19.21 15.814 21 12.5 21C9.186 21 6.5 19.21 6.5 17C6.5 14.79 9.186 13 12.5 13C12.8407 13 13.174 13.0183 13.5 13.055M20.5 19C22.254 18.615 23.5 17.641 23.5 16.5C23.5 15.359 22.254 14.385 20.5 14M4.5 19C2.746 18.615 1.5 17.641 1.5 16.5C1.5 15.359 2.746 14.385 4.5 14"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_14279_57161">
          <rect
            width="24"
            height="24"
            fill="white"
            transform="translate(0.5)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export const Dashboard = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 18V15"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0703 2.81985L3.14027 8.36985C2.36027 8.98985 1.86027 10.2998 2.03027 11.2798L3.36027 19.2398C3.60027 20.6598 4.96027 21.8098 6.40027 21.8098H17.6003C19.0303 21.8098 20.4003 20.6498 20.6403 19.2398L21.9703 11.2798C22.1303 10.2998 21.6303 8.98985 20.8603 8.36985L13.9303 2.82985C12.8603 1.96985 11.1303 1.96985 10.0703 2.81985Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const BookOpen = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 16.7397V4.6697C22 3.4697 21.02 2.5797 19.83 2.6797H19.77C17.67 2.8597 14.48 3.9297 12.7 5.0497L12.53 5.1597C12.24 5.3397 11.76 5.3397 11.47 5.1597L11.22 5.0097C9.44 3.8997 6.26 2.8397 4.16 2.6697C2.97 2.5697 2 3.4697 2 4.6597V16.7397C2 17.6997 2.78 18.5997 3.74 18.7197L4.03 18.7597C6.2 19.0497 9.55 20.1497 11.47 21.1997L11.51 21.2197C11.78 21.3697 12.21 21.3697 12.47 21.2197C14.39 20.1597 17.75 19.0497 19.93 18.7597L20.26 18.7197C21.22 18.5997 22 17.6997 22 16.7397Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5.49023V20.4902"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.75 8.49023H5.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.4902H5.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const VolumeHigh = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 9.99979V13.9998C2 15.9998 3 16.9998 5 16.9998H6.43C6.8 16.9998 7.17 17.1098 7.49 17.2998L10.41 19.1298C12.93 20.7098 15 19.5598 15 16.5898V7.40979C15 4.42979 12.93 3.28979 10.41 4.86979L7.49 6.69979C7.17 6.88979 6.8 6.99979 6.43 6.99979H5C3 6.99979 2 7.99979 2 9.99979Z"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <path
        d="M18 8C19.78 10.37 19.78 13.63 18 16"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.8301 5.5C22.7201 9.35 22.7201 14.65 19.8301 18.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ClipboardClose = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 16.1592L10.04 12.1992"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.96 12.2402L10 16.2002"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 4.01953C19.33 4.19953 21 5.42953 21 9.99953V15.9995C21 19.9995 20 21.9995 15 21.9995H9C4 21.9995 3 19.9995 3 15.9995V9.99953C3 5.43953 4.67 4.19953 8 4.01953"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Settings = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12.8794V11.1194C2 10.0794 2.85 9.21945 3.9 9.21945C5.71 9.21945 6.45 7.93945 5.54 6.36945C5.02 5.46945 5.33 4.29945 6.24 3.77945L7.97 2.78945C8.76 2.31945 9.78 2.59945 10.25 3.38945L10.36 3.57945C11.26 5.14945 12.74 5.14945 13.65 3.57945L13.76 3.38945C14.23 2.59945 15.25 2.31945 16.04 2.78945L17.77 3.77945C18.68 4.29945 18.99 5.46945 18.47 6.36945C17.56 7.93945 18.3 9.21945 20.11 9.21945C21.15 9.21945 22.01 10.0694 22.01 11.1194V12.8794C22.01 13.9194 21.16 14.7794 20.11 14.7794C18.3 14.7794 17.56 16.0594 18.47 17.6294C18.99 18.5394 18.68 19.6994 17.77 20.2194L16.04 21.2094C15.25 21.6794 14.23 21.3994 13.76 20.6094L13.65 20.4194C12.75 18.8494 11.27 18.8494 10.36 20.4194L10.25 20.6094C9.78 21.3994 8.76 21.6794 7.97 21.2094L6.24 20.2194C5.33 19.6994 5.02 18.5294 5.54 17.6294C6.45 16.0594 5.71 14.7794 3.9 14.7794C2.85 14.7794 2 13.9194 2 12.8794Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Calendar2 = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2V5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 2V5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 9.08984H20.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9955 13.6992H12.0045"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.29431 13.6992H8.30329"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.29431 16.6992H8.30329"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
