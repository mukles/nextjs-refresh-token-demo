export type StudentProfile = {
  _id: string;
  name: string;
  mobileNumber: string;
  mobileVerified: boolean;
  image: string | null;
  profileCompleted: boolean;
  isActive: boolean;
  gender: string;
  address: { district?: string };
  institution: { _id: string; institutionShortName: string } | null;
  activeClass: { _id: string; name: string } | null;
  class: { class: string; className: string }[];
  trial: {
    status: string;
    startedAt: string;
    expiresAt: string;
    expiredAt: string;
  } | null;
};
