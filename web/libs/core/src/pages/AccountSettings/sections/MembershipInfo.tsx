import { useEffect, useState } from "react";
import { ToastType, useToast } from "@humansignal/ui";
import { format } from "date-fns";
import styles from "./MembershipInfo.module.scss";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { useCurrentUser } from "/apps/labelstudio/src/providers/CurrentUser";
import { useAPI } from "/apps/labelstudio/src/providers/ApiProvider";

export const MembershipInfo = () => {
  const api = useAPI();
  const toast = useToast();
  const { user } = useCurrentUser();
  const [registrationDate, setRegistrationDate] = useState<string | null>(null);
  const [annotationsCount, setAnnotationsCount] = useState<number | null>(null);
  const [projectsContributedTo, setProjectsContributedTo] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .callApi("userMemberships", {
        params: {
          pk: user.active_organization,
          userPk: user.id,
        },
      })
      .then((response: any) => {
        if (response?.$meta?.ok) {
          setRegistrationDate(format(new Date(response?.created_at), "dd MMM yyyy, KK:mm a"));
          setAnnotationsCount(response?.annotations_count);
          setProjectsContributedTo(response?.contributed_projects_count);
        } else {
          toast.show({
            message: "Failed to fetch membership info",
            type: ToastType.error,
          });
        }
      });
  }, [user?.id]);

  return (
    <div className={styles.membershipInfo} id="membership-info">
      <div className="flex gap-2 w-full justify-between">
        <div>User ID</div>
        <div>{user?.id}</div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>Registration date</div>
        <div>{registrationDate}</div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>Annotations submitted</div>
        <div>{annotationsCount}</div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>Projects contributed to</div>
        <div>{projectsContributedTo}</div>
      </div>

      <div className={styles.divider} />

      <div className="flex gap-2 w-full justify-between">
        <div>Organization</div>
        <div>
          <a href="/organization">{user?.email}</a>
        </div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>My role</div>
        <div>Owner</div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>Organization ID</div>
        <div>{user?.active_organization}</div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>Owner</div>
        <div>{user?.email}</div>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <div>Created</div>
        <div>{registrationDate}</div>
      </div>
    </div>
  );
};
