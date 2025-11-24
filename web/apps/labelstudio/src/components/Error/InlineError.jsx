import React from "react";
import { ApiContext } from "../../providers/ApiProvider";
import { Block } from "../../utils/bem";
import { ErrorWrapper } from "./Error";

export const InlineError = ({ minimal, children, includeValidation, className, style }) => {
  const context = React.useContext(ApiContext);

  React.useEffect(() => {
    context.showGlobalError = false;
  }, [context]);

  return context.error ? (
    <Block name="inline-error" mix={className} style={style}>
      <ErrorWrapper
        possum={false}
        minimal={minimal}
        {...context.errorFormatter(context.error, { includeValidation })}
      />
      {children}
    </Block>
  ) : null;
};
