import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { InputFile, useToast } from "@humansignal/ui";
import { Input } from "/apps/labelstudio/src/components/Form/Elements";
import { Userpic } from "/apps/labelstudio/src/components/Userpic/Userpic";
import { useCurrentUser } from "/apps/labelstudio/src/providers/CurrentUser";
import { Button } from "/apps/labelstudio/src/components/Button/Button";
import { useAPI } from "apps/labelstudio/src/providers/ApiProvider";
import styles from "../AccountSettings.module.scss";

export const PersonalInfo = () => {
  const api = useAPI();
  const toast = useToast();
  const { user, fetch, isInProgress: userInProgress } = useCurrentUser();
  const [fname, setFName] = useState("");
  const [lname, setLName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isInProgress, setIsInProgress] = useState(false);
  const userInfoForm = useRef();
  const userAvatarForm = useRef();
  const avatarRef = useRef();
  const fileChangeHandler = () => userAvatarForm.current.requestSubmit();
  const avatarFormSubmitHandler = useCallback(
    async (e, isDelete = false) => {
      e.preventDefault();
      const response = await api.callApi(isDelete ? "deleteUserAvatar" : "updateUserAvatar", {
        params: {
          pk: user?.id,
        },
        body: {
          avatar: avatarRef.current.files[0],
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
        errorFilter: () => true,
      });
      if (!isDelete && response?.status) {
        toast.show({ message: response?.response?.detail ?? "Error updating avatar", type: "error" });
      } else {
        fetch();
      }
      userAvatarForm.current.reset();
    },
    [user?.id, fetch],
  );
  const userFormSubmitHandler = useCallback(
    async (e) => {
      e.preventDefault();
      const response = await api.callApi("updateUser", {
        params: {
          pk: user?.id,
        },
        body: {
          first_name: fname,
          last_name: lname,
          phone,
        },
        errorFilter: () => true,
      });
      if (response?.status) {
        toast.show({ message: response?.response?.detail ?? "Error updating user", type: "error" });
      } else {
        fetch();
      }
    },
    [fname, lname, phone, user?.id],
  );

  useEffect(() => {
    if (userInProgress) return;
    setFName(user?.first_name);
    setLName(user?.last_name);
    setEmail(user?.email);
    setPhone(user?.phone);
    setIsInProgress(userInProgress);
  }, [user, userInProgress]);

  useEffect(() => setIsInProgress(userInProgress), [userInProgress]);

  return (
    <div className={styles.section} id="personal-info">
      <div className={styles.sectionContent}>
        <div className={styles.flexRow}>
          <Userpic user={user} isInProgress={userInProgress} size={92} style={{ flex: "none" }} />
          <form ref={userAvatarForm} className={styles.flex1} onSubmit={(e) => avatarFormSubmitHandler(e)}>
            <InputFile
              name="avatar"
              onChange={fileChangeHandler}
              accept="image/png, image/jpeg, image/jpg"
              ref={avatarRef}
            />
          </form>
          {user?.avatar && (
            <form onSubmit={(e) => avatarFormSubmitHandler(e, true)}>
              <button type="submit" look="danger">
                Delete
              </button>
            </form>
          )}
        </div>
        <form ref={userInfoForm} className={styles.sectionContent} onSubmit={userFormSubmitHandler}>
          <div className={styles.flexRow}>
            <div className={styles.flex1}>
              <Input label="First Name" value={fname} onChange={(e) => setFName(e.target.value)} />
            </div>
            <div className={styles.flex1}>
              <Input label="Last Name" value={lname} onChange={(e) => setLName(e.target.value)} />
            </div>
          </div>
          <div className={styles.flexRow}>
            <div className={styles.flex1}>
              <Input
                label="E-mail"
                type="email"
                readOnly={true}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.flex1}>
              <Input label="Phone" type="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className={clsx(styles.flexRow, styles.flexEnd)}>
            <Button look="primary" style={{ width: 125 }} waiting={isInProgress}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
