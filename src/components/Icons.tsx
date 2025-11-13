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

export const Profile2User = () => {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.6867 12.6813C10.5701 12.6697 10.4301 12.6697 10.3017 12.6813C7.52507 12.588 5.32007 10.313 5.32007 7.51301C5.32007 4.65467 7.63007 2.33301 10.5001 2.33301C13.3584 2.33301 15.6801 4.65467 15.6801 7.51301C15.6684 10.313 13.4634 12.588 10.6867 12.6813Z"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.1451 4.66699C21.4084 4.66699 23.2284 6.49866 23.2284 8.75033C23.2284 10.9553 21.4784 12.752 19.2967 12.8337C19.2034 12.822 19.0984 12.822 18.9934 12.8337"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.85334 16.987C2.03001 18.877 2.03001 21.957 4.85334 23.8353C8.06167 25.982 13.3233 25.982 16.5317 23.8353C19.355 21.9453 19.355 18.8653 16.5317 16.987C13.335 14.852 8.07334 14.852 4.85334 16.987Z"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.3967 23.333C22.2367 23.158 23.0301 22.8197 23.6834 22.318C25.5034 20.953 25.5034 18.7013 23.6834 17.3363C23.0417 16.8463 22.2601 16.5197 21.4317 16.333"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Profile = () => {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.1867 12.6813C14.0701 12.6697 13.9301 12.6697 13.8017 12.6813C11.0251 12.588 8.82007 10.313 8.82007 7.51301C8.82007 4.65467 11.1301 2.33301 14.0001 2.33301C16.8584 2.33301 19.1801 4.65467 19.1801 7.51301C19.1684 10.313 16.9634 12.588 14.1867 12.6813Z"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.35334 16.987C5.53001 18.877 5.53001 21.957 8.35334 23.8353C11.5617 25.982 16.8233 25.982 20.0317 23.8353C22.855 21.9453 22.855 18.8653 20.0317 16.987C16.835 14.852 11.5733 14.852 8.35334 16.987Z"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Book = () => {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.08325 20.9997V8.16634C4.08325 3.49967 5.24992 2.33301 9.91659 2.33301H18.0833C22.7499 2.33301 23.9166 3.49967 23.9166 8.16634V19.833C23.9166 19.9963 23.9166 20.1597 23.9049 20.323"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.40825 17.5H23.9166V21.5833C23.9166 23.835 22.0849 25.6667 19.8333 25.6667H8.16659C5.91492 25.6667 4.08325 23.835 4.08325 21.5833V20.825C4.08325 18.9933 5.57659 17.5 7.40825 17.5Z"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.33325 8.16699H18.6666"
        stroke="#003366"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.33325 12.25H15.1666"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronRight = () => {
  return (
    <svg
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.42505 14.6004L6.85838 9.16706C7.50005 8.52539 7.50005 7.47539 6.85838 6.83372L1.42505 1.40039"
        stroke="#929292"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Eye = () => {
  return (
    <svg
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.1849 9.00043C12.1849 10.4854 10.9849 11.6854 9.49994 11.6854C8.01494 11.6854 6.81494 10.4854 6.81494 9.00043C6.81494 7.51543 8.01494 6.31543 9.49994 6.31543C10.9849 6.31543 12.1849 7.51543 12.1849 9.00043Z"
        stroke="#003366"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.49988 15.2025C12.1474 15.2025 14.6149 13.6425 16.3324 10.9425C17.0074 9.88504 17.0074 8.10754 16.3324 7.05004C14.6149 4.35004 12.1474 2.79004 9.49988 2.79004C6.85238 2.79004 4.38488 4.35004 2.66738 7.05004C1.99238 8.10754 1.99238 9.88504 2.66738 10.9425C4.38488 13.6425 6.85238 15.2025 9.49988 15.2025Z"
        stroke="#003366"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Edit2 = () => {
  return (
    <svg
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.445 2.70041L4.28751 9.21791C4.05501 9.46541 3.83001 9.95291 3.78501 10.2904L3.50751 12.7204C3.41001 13.5979 4.04001 14.1979 4.91001 14.0479L7.32501 13.6354C7.66251 13.5754 8.13501 13.3279 8.36751 13.0729L14.525 6.55541C15.59 5.43041 16.07 4.14791 14.4125 2.58041C12.7625 1.02791 11.51 1.57541 10.445 2.70041Z"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.41748 3.78711C9.73998 5.85711 11.42 7.43961 13.505 7.64961"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.75 16.5H16.25"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronLeft = () => {
  return (
    <svg
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.50003 1.39961L2.0667 6.83294C1.42503 7.47461 1.42503 8.52461 2.0667 9.16628L7.50003 14.5996"
        stroke="#808080"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronDown = () => {
  return (
    <svg
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.4401 6.71203L10.5501 11.602C9.97256 12.1795 9.02756 12.1795 8.45006 11.602L3.56006 6.71203"
        stroke="#898989"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Search = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5416 19.2497C15.3511 19.2497 19.2499 15.3508 19.2499 10.5413C19.2499 5.73186 15.3511 1.83301 10.5416 1.83301C5.73211 1.83301 1.83325 5.73186 1.83325 10.5413C1.83325 15.3508 5.73211 19.2497 10.5416 19.2497Z"
        stroke="#B3B3B3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.1666 20.1663L18.3333 18.333"
        stroke="#B3B3B3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Power = () => {
  return (
    <svg
      width="20"
      height="22"
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.3601 5.64C17.6185 6.89879 18.4754 8.50244 18.8224 10.2482C19.1694 11.9939 18.991 13.8034 18.3098 15.4478C17.6285 17.0921 16.4749 18.4976 14.9949 19.4864C13.515 20.4752 11.775 21.0029 9.99512 21.0029C8.21521 21.0029 6.47527 20.4752 4.99529 19.4864C3.51532 18.4976 2.36176 17.0921 1.68049 15.4478C0.999212 13.8034 0.82081 11.9939 1.16784 10.2482C1.51487 8.50244 2.37174 6.89879 3.63012 5.64M10.0001 1V11"
        stroke="#929292"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Chart2 = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.50008 18.3337H12.5001C16.6667 18.3337 18.3334 16.667 18.3334 12.5003V7.50033C18.3334 3.33366 16.6667 1.66699 12.5001 1.66699H7.50008C3.33341 1.66699 1.66675 3.33366 1.66675 7.50033V12.5003C1.66675 16.667 3.33341 18.3337 7.50008 18.3337Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.9167 15.4163C13.8333 15.4163 14.5833 14.6663 14.5833 13.7497V6.24967C14.5833 5.33301 13.8333 4.58301 12.9167 4.58301C12 4.58301 11.25 5.33301 11.25 6.24967V13.7497C11.25 14.6663 11.9917 15.4163 12.9167 15.4163Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.08341 15.417C8.00008 15.417 8.75008 14.667 8.75008 13.7503V10.8337C8.75008 9.91699 8.00008 9.16699 7.08341 9.16699C6.16675 9.16699 5.41675 9.91699 5.41675 10.8337V13.7503C5.41675 14.667 6.15841 15.417 7.08341 15.417Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Note = ({ stroke, isActive }: IconProps) => {
  const strokeColor = stroke || (isActive ? "#003366" : "#929292");
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.6666 6.87533V15.0003C16.6666 17.5003 15.1749 18.3337 13.3333 18.3337H6.66659C4.82492 18.3337 3.33325 17.5003 3.33325 15.0003V6.87533C3.33325 4.16699 4.82492 3.54199 6.66659 3.54199C6.66659 4.05866 6.8749 4.52532 7.21656 4.86699C7.55823 5.20866 8.02492 5.41699 8.54159 5.41699H11.4583C12.4916 5.41699 13.3333 4.57533 13.3333 3.54199C15.1749 3.54199 16.6666 4.16699 16.6666 6.87533Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3334 3.54199C13.3334 4.57533 12.4917 5.41699 11.4584 5.41699H8.54175C8.02508 5.41699 7.55839 5.20866 7.21673 4.86699C6.87506 4.52532 6.66675 4.05866 6.66675 3.54199C6.66675 2.50866 7.50841 1.66699 8.54175 1.66699H11.4584C11.9751 1.66699 12.4418 1.87533 12.7834 2.217C13.1251 2.55866 13.3334 3.02533 13.3334 3.54199Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66675 10.833H10.0001"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66675 14.167H13.3334"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Download = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 8.25V12.75L8.25 11.25"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 12.75L5.25 11.25"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 7.5V11.25C16.5 15 15 16.5 11.25 16.5H6.75C3 16.5 1.5 15 1.5 11.25V6.75C1.5 3 3 1.5 6.75 1.5H10.5"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 7.5H13.5C11.25 7.5 10.5 6.75 10.5 4.5V1.5L16.5 7.5Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Copy = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 9.675V12.825C12 15.45 10.95 16.5 8.325 16.5H5.175C2.55 16.5 1.5 15.45 1.5 12.825V9.675C1.5 7.05 2.55 6 5.175 6H8.325C10.95 6 12 7.05 12 9.675Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 5.175V8.325C16.5 10.95 15.45 12 12.825 12H12V9.675C12 7.05 10.95 6 8.325 6H6V5.175C6 2.55 7.05 1.5 9.675 1.5H12.825C15.45 1.5 16.5 2.55 16.5 5.175Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Flash = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.54331 12.1732H11.3758V18.7732C11.3758 19.7448 12.5858 20.2032 13.2275 19.4699L20.1666 11.5865C20.7716 10.899 20.2858 9.82652 19.3691 9.82652H16.5366V3.22652C16.5366 2.25485 15.3266 1.79652 14.685 2.52985L7.74582 10.4132C7.14999 11.1007 7.63581 12.1732 8.54331 12.1732Z"
        stroke="#4D4D4D"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.79167 3.6665H1.375"
        stroke="#4D4D4D"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.875 18.3335H1.375"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.125 11H1.375"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Trash = () => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.125 3.7373C11.0438 3.53105 8.95 3.4248 6.8625 3.4248C5.625 3.4248 4.3875 3.4873 3.15 3.6123L1.875 3.7373"
        stroke="#CC3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.3125 3.10625L5.45 2.2875C5.55 1.69375 5.625 1.25 6.68125 1.25H8.31875C9.375 1.25 9.45625 1.71875 9.55 2.29375L9.6875 3.10625"
        stroke="#CC3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.7813 5.7124L11.375 12.0062C11.3063 12.9874 11.25 13.7499 9.50625 13.7499H5.49375C3.75 13.7499 3.69375 12.9874 3.625 12.0062L3.21875 5.7124"
        stroke="#CC3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.45624 10.3125H8.53749"
        stroke="#CC3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.9375 7.8125H9.0625"
        stroke="#CC3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
