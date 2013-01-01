
class Resource():

    def __init__(self, **kwargs):
        """ kwargs keys can be:
        'buy', 'buys', 'coin', 'coins', 'action', 'actions',
        and the values should be integers.
        key-value pairs can be passed in any order.
        Example: eff = Resource(name: 'Your Name', actions:1, buys:2, coin:1)  
        """
        self.buys = 0
        self.actions = 0
        self.coins = 0
        self.name = ''

        for k, v in kwargs.items():
            if k in ['buy', 'buys']:
                self.buys += v
            elif k in ['coin', 'coins']:
                self.coins += v
            elif k in ['action', 'actions']:
                self.actions += v
            elif k == 'name':
                self.name = v


    def serialize(self):
        """ if self.buys=1, self.actions=2, and the rest is empty, 
        then return {'buys': 1, 'actions': 2}
        """
        d = {}
        attr_names = ['actions', 'buys', 'coins', 'name']
        for attr in attr_names:
            val = getattr(self, attr)
            if val:
                d[attr] = val
        return d


if __name__ == "__main__":
    eff = Resource(coin=3, actions=1, name='blabla')
    print str(eff.serialize())
