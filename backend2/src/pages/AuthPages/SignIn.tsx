import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | MoneyNowWealth"
        description="MoneyNowWealth"
      />
      {/* <AuthLayout> */}
        <SignInForm />
      {/* </AuthLayout> */}
    </>
  );
}
