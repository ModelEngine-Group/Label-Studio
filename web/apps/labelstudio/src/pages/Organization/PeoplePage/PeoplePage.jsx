import { useCallback, useMemo, useRef, useState } from "react";
import { LsPlus } from "../../../assets/icons";
import { Button } from "../../../components";
import { Description } from "../../../components/Description/Description";
import { Input } from "../../../components/Form";
import { HeidiTips } from "../../../components/HeidiTips/HeidiTips";
import { modal } from "../../../components/Modal/Modal";
import { Space } from "../../../components/Space/Space";
import { useAPI } from "../../../providers/ApiProvider";
import { useConfig } from "../../../providers/ConfigProvider";
import { Block, Elem } from "../../../utils/bem";
import { FF_AUTH_TOKENS, FF_LSDV_E_297, isFF } from "../../../utils/feature-flags";
import "./PeopleInvitation.scss";
import { PeopleList } from "./PeopleList";
import "./PeoplePage.scss";
import { SelectedUser } from "./SelectedUser";
import { TokenSettingsModal } from "@humansignal/core/blocks/TokenSettingsModal";
import { InviteLink } from "./InviteLink";
import { useToast } from "@humansignal/ui";
import { debounce } from "@humansignal/core/lib/utils/debounce";
import i18n from 'i18next';
import { useTranslation} from "react-i18next";

const InvitationModal = ({ link }) => {
  return (
    <Block name="invite">
      <Input
        value={link}
        style={{ width: "100%" }}
        readOnly
        onCopy={debounce(() => __lsa("organization.add_people.manual_copy_link"), 1000)}
        onSelect={debounce(() => __lsa("organization.add_people.select_link"), 1000)}
      />

      <Description style={{ marginTop: 16 }}>
        {t('common_caption_for_invite_people')}
        {t('common_button_learn_more')}
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

export const PeoplePage = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const inviteModal = useRef();
  const apiSettingsModal = useRef();
  const config = useConfig();
  const toast = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [invitationOpen, setInvitationOpen] = useState(false);

  const [link, setLink] = useState();

  const selectUser = useCallback(
    (user) => {
      setSelectedUser(user);

      localStorage.setItem("selectedUser", user?.id);
    },
    [setSelectedUser],
  );

  const apiTokensSettingsModalProps = useMemo(
    () => ({
      title: t('common_title_api_token_setting'),
      style: { width: 480 },
      body: () => (
        <TokenSettingsModal
          onSaved={() => {
            toast.show({ message: t("common_tip_for_api_token_saved") });
            apiSettingsModal.current?.close();
          }}
        />
      ),
    }),
    [],
  );

  const showApiTokenSettingsModal = useCallback(() => {
    apiSettingsModal.current = modal(apiTokensSettingsModalProps);
    __lsa("organization.token_settings");
  }, [apiTokensSettingsModalProps]);

  const defaultSelected = useMemo(() => {
    return localStorage.getItem("selectedUser");
  }, []);

  return (
    <Block name="people">
      <Elem name="controls">
        <Space spread>
          <Space />

          <Space>
            {isFF(FF_AUTH_TOKENS) && <Button onClick={showApiTokenSettingsModal}>{t('common_title_api_token_setting')}</Button>}
            <Button icon={<LsPlus />} primary onClick={() => setInvitationOpen(true)}>
              {t('common_button_add_people')}
            </Button>
          </Space>
        </Space>
      </Elem>
      <Elem name="content">
        <PeopleList
          selectedUser={selectedUser}
          defaultSelected={defaultSelected}
          onSelect={(user) => selectUser(user)}
        />

        {selectedUser ? (
          <SelectedUser user={selectedUser} onClose={() => selectUser(null)} />
        ) : (
          isFF(FF_LSDV_E_297) && <HeidiTips collection="organizationPage" />
        )}
      </Elem>
      <InviteLink
        opened={invitationOpen}
        onClosed={() => {
          setInvitationOpen(false);
        }}
      />
    </Block>
  );
};

PeoplePage.title = i18n.t('common_title_people') || 'People';
PeoplePage.path = "/";
