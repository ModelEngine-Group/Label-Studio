import { Description } from "apps/labelstudio/src/components/Description/Description";
import { Block } from "apps/labelstudio/src/components/Menu/MenuContext";
import { Input } from "../../../components/Form";
import { useCallback, useEffect, useRef, useState } from "react";
import { Space } from "@humansignal/ui/lib/space/space";
import { API } from "apps/labelstudio/src/providers/ApiProvider";
import { atomWithQuery } from "jotai-tanstack-query";
import { useAtomValue } from "jotai";
import { Modal } from "apps/labelstudio/src/components/Modal/ModalPopup";
import { Button } from "apps/labelstudio/src/components";
import {useTranslation} from 'react-i18next';

const linkAtom = atomWithQuery(() => ({
  queryKey: ["invite-link"],
  async queryFn() {
    // called only once when the component is rendered on page reload
    // will also be reset when called `refetch()` on the Reset button
    const result = await API.invoke("resetInviteLink");
    return location.origin + result.invite_url;
  },
}));

export function InviteLink({
  opened,
  onOpened,
  onClosed,
}: {
  opened: boolean;
  onOpened?: () => void;
  onClosed?: () => void;
}) {
  const { t } = useTranslation();
  const modalRef = useRef<Modal>();
  useEffect(() => {
    if (modalRef.current && opened) {
      modalRef.current?.show?.();
    } else if (modalRef.current && modalRef.current.visible) {
      modalRef.current?.hide?.();
    }
  }, [opened]);

  return (
    <Modal
      ref={modalRef}
      title={t('common_title_invite_people')}
      opened={opened}
      bareFooter={true}
      body={<InvitationModal />}
      footer={<InvitationFooter />}
      style={{ width: 640, height: 472 }}
      onHide={onClosed}
      onShow={onOpened}
    />
  );
}

const InvitationModal = () => {
  const {t} = useTranslation();
  const { data: link } = useAtomValue(linkAtom);
  return (
    <Block name="invite">
      <Input value={link} style={{ width: "100%" }} readOnly />

      <Description style={{ marginTop: 16 }}>
        {t('common_tip_for_invite_people')}
        <a
          href="https://labelstud.io/guide/signup.html"
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            __lsa("docs.organization.add_people.learn_more", { href: "https://labelstud.io/guide/signup.html" })
          }
        >
          {t('common_button_learn_more')}
        </a>
        .
      </Description>
    </Block>
  );
};

const InvitationFooter = () => {
  const { t } = useTranslation();
  const { copyText, copied } = useTextCopy();
  const { refetch, data: link } = useAtomValue(linkAtom);

  return (
    <Space spread>
      <Space>
        <Button variant="secondary" style={{ width: 170 }} onClick={() => refetch()}>
          {t('common_button_reset_link')}
        </Button>
      </Space>
      <Space>
        <Button look="primary" style={{ width: 170 }} onClick={() => copyText(link!)}>
          {copied ? t('common_button_copied') : t('common_button_copy_link')}
        </Button>
      </Space>
    </Space>
  );
};

function useTextCopy() {
  const [copied, setCopied] = useState(false);

  const copyText = useCallback((value: string) => {
    setCopied(true);
    navigator.clipboard.writeText(value ?? "");
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return { copied, copyText };
}
