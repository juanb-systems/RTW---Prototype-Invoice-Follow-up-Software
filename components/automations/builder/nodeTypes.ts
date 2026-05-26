import { TriggerNode } from "./nodes/TriggerNode";
import { LookupCheckNode } from "./nodes/LookupCheckNode";
import { EmailNode } from "./nodes/EmailNode";
import { SMSNode } from "./nodes/SMSNode";
import { CallNode } from "./nodes/CallNode";
import { WaitNode } from "./nodes/WaitNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { EndNode } from "./nodes/EndNode";

export const nodeTypes = {
  trigger: TriggerNode,
  lookup_check: LookupCheckNode,
  email: EmailNode,
  sms: SMSNode,
  call: CallNode,
  wait: WaitNode,
  condition: ConditionNode,
  end: EndNode,
} as const;
